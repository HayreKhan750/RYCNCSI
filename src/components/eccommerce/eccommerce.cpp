// eccommerce.cpp
// E-commerce Cart System (single-file CLI)
// Compile (Linux/macOS): g++ -std=c++17 -O2 eccommerce.cpp -o ecommerce
// Compile (Windows / MinGW): g++ -std=c++17 -O2 eccommerce.cpp -o ecommerce.exe

#include <algorithm>
#include <chrono>
#include <iomanip>
#include <iostream>
#include <limits>
#include <climits>
#include <random>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

// ----------------------------- Utility helpers -----------------------------

string toLower(const string &s) {
    string r = s;
    transform(r.begin(), r.end(), r.begin(), [](unsigned char c) { return static_cast<char>(tolower(c)); });
    return r;
}

string trim(const string &s) {
    size_t a = s.find_first_not_of(" \t\r\n");
    if (a == string::npos) return "";
    size_t b = s.find_last_not_of(" \t\r\n");
    return s.substr(a, b - a + 1);
}

long long nowMillis() {
    using namespace chrono;
    return duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
}

string generateOrderId() {
    // Human-friendly: ORD-<timestamp>-<random4>
    static std::mt19937_64 rng(static_cast<unsigned long long>(nowMillis()));
    std::uniform_int_distribution<int> dist(1000, 9999);
    return string("ORD-") + to_string(nowMillis()) + "-" + to_string(dist(rng));
}

// ----------------------------- Domain models -----------------------------

struct Product {
    int id = 0;
    string name;
    string description;
    double price = 0.0;
    int stock = 0;
};

struct CartItem {
    int productId = 0;
    string name;
    double price = 0.0;
    int quantity = 0;

    double lineTotal() const { return price * quantity; }
};

struct Order {
    string orderId;
    long long timestamp = 0;
    vector<CartItem> items;
    double subtotal = 0.0;
    double tax = 0.0;
    double total = 0.0;
    string customerName;
    string status; // e.g. "Placed", "Shipped", ...
};

// ----------------------------- Persistence (unused stub) -----------------------------

// Kept only so existing types compile; does not perform any I/O.
struct Persistence {
    string productsFile = "products.db";
    string cartFile = "cart.db";
    string ordersFile = "orders.db";

    void saveProducts(const vector<Product> &) {}

    vector<Product> loadProducts() { return {}; }

    void saveCart(const vector<CartItem> &) {}

    vector<CartItem> loadCart() { return {}; }

    void appendOrder(const Order &) {}

    vector<Order> loadOrders() { return {}; }
};

// ----------------------------- Managers -----------------------------

struct Catalog {
    vector<Product> products;
    int nextId = 1;

    Catalog() {
        seedDefaultProducts();
    }

    void seedDefaultProducts() {
        products.clear();
        Product p1; p1.id = nextId++; p1.name = "Atlas Wireless Headphones"; p1.description = "Noise-cancelling over-ear headphones"; p1.price = 79.99; p1.stock = 15;
        Product p2; p2.id = nextId++; p2.name = "Aurora Smartwatch"; p2.description = "Fitness tracking, heart rate & notifications"; p2.price = 129.50; p2.stock = 20;
        Product p3; p3.id = nextId++; p3.name = "Nimbus Mechanical Keyboard"; p3.description = "RGB mechanical keyboard, hot-swappable switches"; p3.price = 99.00; p3.stock = 10;
        Product p4; p4.id = nextId++; p4.name = "Voyager 64GB USB-C Flash"; p4.description = "High-speed portable storage"; p4.price = 19.90; p4.stock = 50;
        Product p5; p5.id = nextId++; p5.name = "Lumen Desk Lamp"; p5.description = "Dimmable LED lamp with USB charge"; p5.price = 34.99; p5.stock = 18;

        products = {p1, p2, p3, p4, p5};
    }

    vector<Product> searchByName(const string &term) const {
        string t = toLower(term);
        vector<Product> out;
        for (const auto &p : products) {
            if (toLower(p.name).find(t) != string::npos) out.push_back(p);
        }
        return out;
    }

    Product *findById(int id) {
        for (auto &p : products) if (p.id == id) return &p;
        return nullptr;
    }

    void addProduct(const Product &p) {
        Product np = p;
        np.id = nextId++;
        products.push_back(np);
    }

    bool removeProduct(int id) {
        auto it = remove_if(products.begin(), products.end(), [&](const Product &p) { return p.id == id; });
        if (it == products.end()) return false;
        products.erase(it, products.end());
        return true;
    }

    void updateProductStock(int id, int delta) {
        Product *p = findById(id);
        if (p) {
            p->stock += delta;
            if (p->stock < 0) p->stock = 0;
        }
    }

    void listAll(ostream &out, bool showStock = true) const {
        if (products.empty()) {
            out << "No products available.\n";
            return;
        }
        out << "ID  | Name (price)";
        if (showStock) out << " - stock";
        out << "\n";
        out << "------------------------------------------------\n";
        for (const auto &p : products) {
            out << setw(3) << p.id << " | " << p.name << " ($" << fixed << setprecision(2) << p.price << ")";
            if (showStock) out << " - stock: " << p.stock;
            out << "\n  " << p.description << "\n";
            out << "\n";
        }
    }

    void sortByPrice(bool ascend = true) {
        sort(products.begin(), products.end(), [&](const Product &a, const Product &b) {
            return ascend ? (a.price < b.price) : (a.price > b.price);
        });
    }

    void sortByName(bool ascend = true) {
        sort(products.begin(), products.end(), [&](const Product &a, const Product &b) {
            return ascend ? (toLower(a.name) < toLower(b.name)) : (toLower(a.name) > toLower(b.name));
        });
    }
};

struct Cart {
    vector<CartItem> items;
    Catalog &catalog;

    Cart(Catalog &c) : catalog(c) {}

    void addItem(const Product &p, int qty) {
        if (qty <= 0) return;
        for (auto &it : items) {
            if (it.productId == p.id) {
                it.quantity += qty;
                return;
            }
        }
        CartItem n;
        n.productId = p.id;
        n.name = p.name;
        n.price = p.price;
        n.quantity = qty;
        items.push_back(n);
    }

    bool removeItem(int productId) {
        auto it = remove_if(items.begin(), items.end(), [&](const CartItem &ci) { return ci.productId == productId; });
        if (it == items.end()) return false;
        items.erase(it, items.end());
        return true;
    }

    double subtotal() const {
        double s = 0.0;
        for (const auto &it : items) s += it.lineTotal();
        return s;
    }

    void display(ostream &out) const {
        if (items.empty()) {
            out << "Cart is empty.\n";
            return;
        }
        out << "Cart Items:\n";
        out << "ID  | Name | Price | Qty | LineTotal\n";
        out << "---------------------------------------------\n";
        for (const auto &it : items) {
            out << setw(3) << it.productId << " | "
                << it.name << " | $" << fixed << setprecision(2) << it.price
                << " | " << it.quantity
                << " | $" << fixed << setprecision(2) << it.lineTotal() << "\n";
        }
        out << "---------------------------------------------\n";
        out << "Subtotal: $" << fixed << setprecision(2) << subtotal() << "\n";
    }

    bool isEmpty() const { return items.empty(); }

    void clear() {
        items.clear();
    }
};

struct OrderManager {
    vector<Order> orders;

    void addOrder(const Order &o) {
        orders.push_back(o);
    }

    void listOrders(ostream &out) const {
        if (orders.empty()) {
            out << "No orders placed yet.\n";
            return;
        }
        out << left << setw(26) << "Order ID" << " | "
            << setw(18) << "Customer" << " | "
            << setw(10) << "Total" << " | Status\n";
        out << string(70, '-') << "\n";
        for (const auto &o : orders) {
            out << left << setw(26) << o.orderId << " | "
                << setw(18) << o.customerName << " | $"
                << setw(9) << fixed << setprecision(2) << o.total
                << " | " << o.status << "\n";
        }
    }

    const Order *findById(const string &id) const {
        for (const auto &o : orders) if (o.orderId == id) return &o;
        return nullptr;
    }
};

// ----------------------------- CLI helpers -----------------------------

void pressEnterToContinue() {
    cout << "\nPress Enter to continue...";
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
}

int readInt(const string &prompt, int minv = INT_MIN, int maxv = INT_MAX) {
    while (true) {
        cout << prompt;
        string s;
        if (!getline(cin, s)) return minv;
        s = trim(s);
        if (s.empty()) {
            cout << "Please enter a number.\n";
            continue;
        }
        try {
            int v = stoi(s);
            if (v < minv || v > maxv) {
                cout << "Value out of range. Try again.\n";
                continue;
            }
            return v;
        } catch (...) {
            cout << "Invalid integer. Try again.\n";
        }
    }
}

double readDouble(const string &prompt, double minv = -1e18, double maxv = 1e18) {
    while (true) {
        cout << prompt;
        string s;
        if (!getline(cin, s)) return minv;
        s = trim(s);
        if (s.empty()) {
            cout << "Please enter a number.\n";
            continue;
        }
        try {
            double v = stod(s);
            if (v < minv || v > maxv) {
                cout << "Value out of range. Try again.\n";
                continue;
            }
            return v;
        } catch (...) {
            cout << "Invalid number. Try again.\n";
        }
    }
}

string readLineNonEmpty(const string &prompt) {
    while (true) {
        cout << prompt;
        string s;
        if (!getline(cin, s)) return "";
        s = trim(s);
        if (s.empty()) {
            cout << "Value cannot be empty.\n";
            continue;
        }
        return s;
    }
}

// Forward declaration
void mainMenu(Catalog &catalog, Cart &cart, OrderManager &orders);

// ----------------------------- Admin menu -----------------------------

void adminMenu(Catalog &catalog) {
    while (true) {
        cout << "\n--- Admin: Product Management ---\n";
        cout << "1) List products\n";
        cout << "2) Add product\n";
        cout << "3) Edit product (name/desc/price/stock)\n";
        cout << "4) Remove product\n";
        cout << "0) Back to main menu\n";

        string choice;
        cout << "Choose: ";
        if (!getline(cin, choice)) break;
        choice = trim(choice);

        if (choice == "1") {
            catalog.listAll(cout);
            pressEnterToContinue();
        } else if (choice == "2") {
            Product p;
            p.name = readLineNonEmpty("Name: ");
            p.description = readLineNonEmpty("Description: ");
            p.price = readDouble("Price: $", 0.0);
            p.stock = readInt("Stock (integer): ", 0);
            catalog.addProduct(p);
            cout << "Product added.\n";
            pressEnterToContinue();
        } else if (choice == "3") {
            int id = readInt("Product ID to edit: ");
            Product *p = catalog.findById(id);
            if (!p) {
                cout << "Product not found.\n";
                pressEnterToContinue();
                continue;
            }

            cout << "Editing: " << p->name << "\n";
            cout << "Leave field empty to keep current value.\n";

            cout << "Current name: " << p->name << "\nNew name: ";
            string tmp;
            getline(cin, tmp);
            tmp = trim(tmp);
            if (!tmp.empty()) p->name = tmp;

            cout << "Current description: " << p->description << "\nNew description: ";
            getline(cin, tmp);
            tmp = trim(tmp);
            if (!tmp.empty()) p->description = tmp;

            cout << "Current price: " << fixed << setprecision(2) << p->price << "\nNew price: ";
            getline(cin, tmp);
            tmp = trim(tmp);
            if (!tmp.empty()) p->price = stod(tmp);

            cout << "Current stock: " << p->stock << "\nNew stock: ";
            getline(cin, tmp);
            tmp = trim(tmp);
            if (!tmp.empty()) p->stock = stoi(tmp);

            cout << "Product updated.\n";
            pressEnterToContinue();
        } else if (choice == "4") {
            int id = readInt("Product ID to remove: ");
            if (catalog.removeProduct(id)) cout << "Removed.\n";
            else cout << "Product not found.\n";
            pressEnterToContinue();
        } else if (choice == "0") {
            break;
        } else {
            cout << "Unknown option.\n";
        }
    }
}

// ----------------------------- User flows -----------------------------

void searchAndList(Catalog &catalog) {
    string term;
    cout << "Search term: ";
    getline(cin, term);
    term = trim(term);
    if (term.empty()) {
        cout << "Empty search term.\n";
        return;
    }
    auto results = catalog.searchByName(term);
    if (results.empty()) {
        cout << "No products matched your search.\n";
        return;
    }
    cout << "\nSearch results (" << results.size() << "):\n\n";
    for (const auto &p : results) {
        cout << p.id << " | " << p.name << " ($" << fixed << setprecision(2) << p.price
             << ") - stock: " << p.stock << "\n  " << p.description << "\n\n";
    }
}

void sortMenu(Catalog &catalog) {
    cout << "Sort by: 1) Price  2) Name\n";
    int field = readInt("Select field: ", 1, 2);
    cout << "Order: 1) Ascending  2) Descending\n";
    int order = readInt("Select order: ", 1, 2);
    bool ascend = (order == 1);

    if (field == 1) catalog.sortByPrice(ascend);
    else catalog.sortByName(ascend);

    cout << "\nProducts sorted.\n";
    catalog.listAll(cout);
    pressEnterToContinue();
}

void checkoutFlow(Catalog &catalog, Cart &cart, OrderManager &orders) {
    if (cart.isEmpty()) {
        cout << "Cart is empty, nothing to checkout.\n";
        return;
    }

    cart.display(cout);
    cout << "\nProceed to checkout? (y/N): ";
    string ans;
    getline(cin, ans);
    if (toLower(trim(ans)) != "y") {
        cout << "Checkout cancelled.\n";
        return;
    }

    string cname = readLineNonEmpty("Customer name: ");

    // Verify stock
    for (const auto &it : cart.items) {
        Product *p = catalog.findById(it.productId);
        if (!p) {
            cout << "Product with ID " << it.productId << " no longer exists. Please update cart.\n";
            return;
        }
        if (it.quantity > p->stock) {
            cout << "Insufficient stock for " << p->name << ". Available: " << p->stock << "\n";
            return;
        }
    }

    const double TAX_RATE = 0.07; // 7% tax
    double subtotal = cart.subtotal();
    double tax = subtotal * TAX_RATE;
    double total = subtotal + tax;

    Order o;
    o.orderId = generateOrderId();
    o.timestamp = nowMillis();
    o.items = cart.items;
    o.subtotal = subtotal;
    o.tax = tax;
    o.total = total;
    o.customerName = cname;
    o.status = "Placed";

    // Deduct stock
    for (const auto &it : cart.items) {
        catalog.updateProductStock(it.productId, -it.quantity);
    }

    orders.addOrder(o);
    cart.clear();

    cout << "\nOrder placed successfully!\n";
    cout << "Order ID : " << o.orderId << "\n";
    cout << "Subtotal : $" << fixed << setprecision(2) << o.subtotal << "\n";
    cout << "Tax      : $" << fixed << setprecision(2) << o.tax << "\n";
    cout << "Total    : $" << fixed << setprecision(2) << o.total << "\n";
    cout << "You can track your order later using the Order ID.\n";
}

void trackOrders(OrderManager &orders) {
    cout << "\n--- Orders ---\n";
    orders.listOrders(cout);

    cout << "\nView details for a specific order? Enter Order ID (or leave empty to go back): ";
    string id;
    getline(cin, id);
    id = trim(id);
    if (id.empty()) return;

    const Order *o = orders.findById(id);
    if (!o) {
        cout << "Order not found.\n";
        return;
    }

    cout << "\nOrder: " << o->orderId << "\n";
    cout << "Customer: " << o->customerName << "\n";
    cout << "Status  : " << o->status << "\n";
    cout << "Placed  : " << o->timestamp << " (ms since epoch)\n";
    cout << "Items:\n";
    for (const auto &it : o->items) {
        cout << "  " << it.productId << " | " << it.name
             << " | $" << fixed << setprecision(2) << it.price
             << " x " << it.quantity
             << " = $" << fixed << setprecision(2) << it.lineTotal() << "\n";
    }
    cout << "Subtotal: $" << fixed << setprecision(2) << o->subtotal
         << "  Tax: $" << fixed << setprecision(2) << o->tax
         << "  Total: $" << fixed << setprecision(2) << o->total << "\n";
}

// ----------------------------- Main menu -----------------------------

void mainMenu(Catalog &catalog, Cart &cart, OrderManager &orders) {
    while (true) {
        cout << "\n===== E-commerce Cart System =====\n";
        cout << "1) Display products\n";
        cout << "2) Search products\n";
        cout << "3) Sort products (price/name)\n";
        cout << "4) Add product to cart\n";
        cout << "5) Remove product from cart\n";
        cout << "6) View cart\n";
        cout << "7) Checkout\n";
        cout << "8) Track orders\n";
        cout << "9) Admin: manage products\n";
        cout << "0) Exit\n";

        string choice;
        cout << "Choose an option: ";
        if (!getline(cin, choice)) break;
        choice = trim(choice);

        if (choice == "1") {
            catalog.listAll(cout);
            pressEnterToContinue();
        } else if (choice == "2") {
            searchAndList(catalog);
            pressEnterToContinue();
        } else if (choice == "3") {
            sortMenu(catalog);
        } else if (choice == "4") {
            int id = readInt("Product ID to add: ");
            Product *p = catalog.findById(id);
            if (!p) {
                cout << "Product not found.\n";
                pressEnterToContinue();
                continue;
            }
            cout << "Selected: " << p->name << " ($" << fixed << setprecision(2) << p->price
                 << ") - stock: " << p->stock << "\n";
            int qty = readInt("Quantity: ", 1, p->stock);
            cart.addItem(*p, qty);
            cout << "Added to cart.\n";
            pressEnterToContinue();
        } else if (choice == "5") {
            int id = readInt("Product ID to remove from cart: ");
            if (cart.removeItem(id)) cout << "Removed from cart.\n";
            else cout << "Item not found in cart.\n";
            pressEnterToContinue();
        } else if (choice == "6") {
            cart.display(cout);
            pressEnterToContinue();
        } else if (choice == "7") {
            checkoutFlow(catalog, cart, orders);
            pressEnterToContinue();
        } else if (choice == "8") {
            trackOrders(orders);
            pressEnterToContinue();
        } else if (choice == "9") {
            cout << "Admin password (default: admin123): ";
            string pw;
            getline(cin, pw);
            if (trim(pw) == "admin123") adminMenu(catalog);
            else cout << "Incorrect password.\n";
        } else if (choice == "0") {
            cout << "Goodbye!\n";
            break;
        } else {
            cout << "Unknown option. Please try again.\n";
        }
    }
}

// ----------------------------- main -----------------------------

int main() {
    ios::sync_with_stdio(false);

    Catalog catalog;
    Cart cart(catalog);
    OrderManager orders;

    cout << "Welcome to the E-commerce Cart System (CLI)\n";

    mainMenu(catalog, cart, orders);
    return 0;
}