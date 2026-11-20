import type {SupabaseClient} from '@supabase/supabase-js';

export type AdminAccess = 'checking' | 'signed-out' | 'authorized' | 'forbidden' | 'unavailable' | 'error';
export type AdminAuthClient = Pick<SupabaseClient, 'auth' | 'from'>;

// Verify the user with Auth, then check the server-managed role registry.
// A locally cached session alone never grants access to the editor.
export async function verifyAdminAccess(client:AdminAuthClient|null):Promise<AdminAccess>{
  if(!client)return 'unavailable';
  try{
    const {data,error}=await client.auth.getUser();
    if(error||!data.user)return 'signed-out';
    const {data:membership,error:roleError}=await client.from('admin_users')
      .select('role').eq('user_id',data.user.id).maybeSingle();
    if(roleError)return 'error';
    return membership&&(membership.role==='owner'||membership.role==='admin')?'authorized':'forbidden';
  }catch{return 'error'}
}
