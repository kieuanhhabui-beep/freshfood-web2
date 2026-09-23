import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kcnszcxhffsqjgykcexj.supabase.co'
const supabaseKey = 'sb_publishable_Gmahzu1kupXbNd6wzvYoTA__k7xaorq'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)
