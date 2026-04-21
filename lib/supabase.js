import 'react-native-url-polyfill/auto'
import 'expo-sqlite/localStorage/install'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// ─── AUTH ───────────────────────────────────────────────

export const createUser = async ({ username, email, password, city, language, genres }) => {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  console.log('Auth user created:', data.user.id)

  const { error: dbError } = await supabase.from('users').insert({
    id: data.user.id,
    username,
    email,
    city,
    language: language || 'fr',
    genres: genres || [],
  })
  if (dbError) throw dbError

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (profileError) throw profileError
  return profile
}



export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

// ─── BOOKS ──────────────────────────────────────────────


export const getBooks = async ({ type, remise, city, genre } = {}) => {
  let query = supabase
    .from('books')
    .select('*, creator:users(*)')
    .order('created_at', { ascending: false })

  if (type) query = query.ilike('type', `%${type}%`)
  if (remise) query = query.ilike('type', `%${remise}%`)
  if (city) query = query.eq('city', city)
  if (genre) query = query.eq('genre', genre)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getBookById = async (id) => {
  const { data, error } = await supabase
    .from('books')
    .select('*, creator:users(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}


export const addBook = async ({ title, author, description, genre, state, type, city, imageUri, userId }) => {
  let imageUrl = null

  if (imageUri) {
    const fileName = `${userId}_${Date.now()}.jpg`

    const formData = new FormData()
    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: 'image/jpeg',
    })

    const { error: uploadError } = await supabase.storage
      .from('books')
      .upload(fileName, formData, { contentType: 'image/jpeg' })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('books')
      .getPublicUrl(fileName)

    imageUrl = urlData.publicUrl
  }

  const { data, error } = await supabase.from('books').insert({
    title,
    author,
    description,
    genre,
    state,
    type,
    city,
    image: imageUrl,
    creator_id: userId,
  }).select().single()

  if (error) throw error
  return data
}
export const updateBook = async (id, updates) => {
  const { data, error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteBook = async (id) => {
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error
}

// ─── USERS ──────────────────────────────────────────────

export const updateUser = async (id, updates, avatarUri = null) => {
  console.log('updateUser called', { id, avatarUri });

  try {
    if (avatarUri) {
      console.log('uploading avatar...');
      const fileName = `${id}.jpg`;

      const formData = new FormData();
      formData.append('file', {
        uri: avatarUri,
        name: fileName,
        type: 'image/jpeg',
      });

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, formData, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) {
        console.log('UPLOAD ERROR:', JSON.stringify(uploadError, null, 2));
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      updates.avatar = urlData.publicUrl;
      console.log('avatar uploaded:', updates.avatar);
    }

    console.log('updating user...', JSON.stringify(updates, null, 2));

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    console.log('UPDATE ERROR:', JSON.stringify(error, null, 2));
    console.log('UPDATE DATA:', JSON.stringify(data, null, 2));

    if (error) throw error;
    return data;

  } catch (e) {
    console.log('CATCH ERROR:', e.message, JSON.stringify(e, null, 2));
    throw e;
  }
};