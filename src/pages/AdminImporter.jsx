import { useMemo, useState } from 'react';
import rawData from '../assets/my-file.optimized.json';
import { db } from '../firebase';
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';

const splitInstructors = (s) => {
  if (!s) return [];
  return s
    .split(/&|,| and /gi)
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => t.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim());
};

const slug = (s) => s.toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

export default function AdminImporter() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(null);

  const flattened = useMemo(() => {
    const items = [];
    for (const cohortKey of Object.keys(rawData)) {
      for (const entry of rawData[cohortKey]) {
        items.push({ cohortKey, ...entry });
      }
    }
    return items;
  }, []);

  const buildPlan = () => {
    const departments = new Map();
    const courses = new Map();
    const instructors = new Map();
    const sections = new Map();

    for (const it of flattened) {
      const deptName = it.dept || it.department || 'Unknown';
      const deptId = slug(deptName);
      if (!departments.has(deptId)) departments.set(deptId, { id: deptId, name: deptName });

      const courseCode = String(it.courseNo || it.courseCode || it.course || it.courseTitle).trim();
      const courseId = slug(courseCode);
      const courseTitle = it.courseTitle || courseCode;
      if (!courses.has(courseId)) courses.set(courseId, { id: courseId, code: courseCode, title: courseTitle, departmentId: deptId });

      const names = splitInstructors(it.instructors);
      const instructorIds = [];
      for (const name of names) {
        const iid = slug(`${name}-${deptId}`);
        instructorIds.push(iid);
        if (!instructors.has(iid)) instructors.set(iid, {
          id: iid,
          displayName: name,
          departmentId: deptId,
          photoURL: '',
          bio: '',
          aggregates: { avgRating: 0, ratingCount: 0, tagsMap: {} },
          updatedAt: null,
        });
      }

      const key = slug(`${courseId}-${instructorIds.join('_')}-${it.cohortKey || ''}-${it.period || ''}-${it.room || ''}`);
      if (!sections.has(key)) sections.set(key, {
        id: key,
        courseId,
        departmentId: deptId,
        instructorIds,
        cohortKey: it.cohortKey || null,
        yearLevel: it.cohortKey || null,
        period: it.period || null,
        room: it.room || null,
        lectureHours: it.lectureHours || null,
        studentNumber: it.studentNumber || null,
        createdAt: null,
      });
    }

    return {
      counts: {
        departments: departments.size,
        courses: courses.size,
        instructors: instructors.size,
        sections: sections.size,
      },
      data: { departments, courses, instructors, sections },
    };
  };

  const handlePreview = () => {
    const plan = buildPlan();
    setPreview(plan);
    setMessage('Preview generated.');
  };

  const commitMap = async (collection, map) => {
    const entries = Array.from(map.values());
    let processed = 0;
    for (let i = 0; i < entries.length; i += 400) { // sub-batches for safety
      const slice = entries.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const item of slice) {
        const ref = doc(db, collection, item.id);
        const payload = { ...item };
        if (collection === 'instructors') payload.updatedAt = serverTimestamp();
        if (collection === 'sections') payload.createdAt = serverTimestamp();
        batch.set(ref, payload, { merge: true });
      }
      await batch.commit();
      processed += slice.length;
      setMessage(`${collection}: ${processed}/${entries.length} written...`);
    }
  };

  const handleImport = async () => {
    try {
      setStatus('running');
      setMessage('Building import plan...');
      const plan = buildPlan();
      setPreview(plan);

      setMessage('Writing departments...');
      await commitMap('departments', plan.data.departments);
      setMessage('Writing courses...');
      await commitMap('courses', plan.data.courses);
      setMessage('Writing instructors...');
      await commitMap('instructors', plan.data.instructors);
      setMessage('Writing sections...');
      await commitMap('sections', plan.data.sections);

      setStatus('done');
      setMessage('Import completed successfully.');
    } catch (e) {
      console.error(e);
      setStatus('error');
      setMessage(`Failed: ${e.message}`);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
      <h2>Admin Data Importer</h2>
      <p>This tool parses src/assets/my-file.optimized.json and seeds Firestore.</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handlePreview}>Preview</button>
        <button onClick={handleImport} disabled={status === 'running'}>Import</button>
      </div>
      <div style={{ marginTop: 12, color: status === 'error' ? 'red' : '#333' }}>{message}</div>
      {preview && (
        <div style={{ marginTop: 16 }}>
          <strong>Preview counts</strong>
          <ul>
            <li>Departments: {preview.counts.departments}</li>
            <li>Courses: {preview.counts.courses}</li>
            <li>Instructors: {preview.counts.instructors}</li>
            <li>Sections: {preview.counts.sections}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
