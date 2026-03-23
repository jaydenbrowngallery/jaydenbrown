import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('gallery_posts')
  .select('id, title, slug');

console.log('현재 갤러리 목록:');
console.log(JSON.stringify(data, null, 2));
