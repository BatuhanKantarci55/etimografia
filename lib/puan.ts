import { supabase as supabaseClient } from '@/lib/supabaseClient';

export async function puanGuncelle(yeniPuan: number) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data: mevcutVeri, error: veriHatasi } = await supabaseClient
        .from('profiles')
        .select('highest_score, total_score')
        .eq('id', user.id)
        .single();

    if (veriHatasi || !mevcutVeri) return;

    const mevcutEnYuksek = mevcutVeri.highest_score || 0;
    const mevcutToplam = mevcutVeri.total_score || 0;

    const yeniEnYuksek = Math.max(mevcutEnYuksek, yeniPuan);
    const yeniToplam = mevcutToplam + yeniPuan;

    const { error } = await supabaseClient
        .from('profiles')
        .update({
            highest_score: yeniEnYuksek,
            total_score: yeniToplam,
        })
        .eq('id', user.id);

    if (error) {
        console.error('Puan güncellenemedi:', error);
    }
}
