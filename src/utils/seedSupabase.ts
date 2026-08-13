import { supabase } from '../lib/supabase';
import {
  initialUsers,
  initialCategories,
  initialArticles,
  initialHandoverDocs,
  initialForumTopics,
  initialActivities,
  initialPendingDocs
} from '../data/mockData';
import { parseBytes } from './fileTypeHelper';
import { formatDateToISO } from './dateUtils';

export const seedSupabaseData = async () => {
  console.log('🚀 Starting Supabase Data Seeding...');

  try {
    // 1. Seed Categories
    console.log('Seeding categories...');
    const { error: catErr } = await supabase.from('categories').upsert(
      initialCategories.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        content_count: c.contentCount,
        icon: c.icon
      }))
    );
    if (catErr) console.error('Error seeding categories:', catErr.message);

    // 2. Seed Users / Profiles
    console.log('Seeding profiles...');
    const { error: userErr } = await supabase.from('profiles').upsert(
      initialUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        division: u.division,
        status: u.status === 'Aktif',
        join_date: formatDateToISO(u.joinDate),
        initials: u.initials,
        password: u.password || 'password123',
        must_change_password: u.mustChangePassword || false
      }))
    );
    if (userErr) console.error('Error seeding profiles:', userErr.message);

    // 3. Seed Articles
    console.log('Seeding knowledge articles...');
    const { error: artErr } = await supabase.from('knowledge_articles').upsert(
      initialArticles.map(a => ({
        id: a.id,
        title: a.title,
        category: a.category,
        summary: a.summary,
        author: a.author,
        date: formatDateToISO(a.date),
        file_type: a.fileType === 'LINK' ? 'LINK' : (a.fileType || 'PDF'),
        views: a.views || 0,
        content_type: a.contentType || 'file'
      }))
    );
    if (artErr) console.error('Error seeding articles:', artErr.message);

    // 4. Seed Handover Docs
    console.log('Seeding handover docs...');
    const { error: hoErr } = await supabase.from('handover_docs').upsert(
      initialHandoverDocs.map(h => ({
        id: h.id,
        title: h.title,
        file_type: h.fileType === 'LINK' ? null : h.fileType,
        file_size: parseBytes(h.fileSize),
        rotation_period: h.rotationPeriod,
        division: h.division,
        submit_date: formatDateToISO(h.submitDate),
        author: h.author || 'Karyawan',
        author_role: h.authorRole || 'Karyawan',
        description: h.description,
        content_type: h.contentType || 'file'
      }))
    );
    if (hoErr) console.error('Error seeding handover docs:', hoErr.message);

    // 5. Seed Forum Topics
    console.log('Seeding forum topics...');
    const { error: ftErr } = await supabase.from('forum_topics').upsert(
      initialForumTopics.map(f => ({
        id: f.id,
        title: f.title,
        category: f.category,
        author: f.author,
        author_role: f.authorRole,
        author_initials: f.authorInitials,
        views: f.views,
        comment_count: f.commentCount,
        content: f.content,
        tags: f.tags
      }))
    );
    if (ftErr) console.error('Error seeding forum topics:', ftErr.message);

    // 6. Seed Pending Docs
    console.log('Seeding pending docs...');
    const { error: pvErr } = await supabase.from('pending_docs').upsert(
      initialPendingDocs.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        author: p.author,
        file_name: p.fileName,
        file_size: parseBytes(p.fileSize),
        description: p.description,
        tags: p.tags,
        status: p.status
      }))
    );
    if (pvErr) console.error('Error seeding pending docs:', pvErr.message);

    // 7. Seed Activity Logs
    console.log('Seeding activity logs...');
    const { error: actErr } = await supabase.from('activity_logs').upsert(
      initialActivities.map(act => ({
        id: act.id,
        user_name: act.user,
        user_initials: act.userInitials,
        department: act.department,
        action: act.action,
        time_ago: act.timeAgo,
        status: act.status
      }))
    );
    if (actErr) console.error('Error seeding activity logs:', actErr.message);

    console.log('✅ Supabase Seeding Completed!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
};

