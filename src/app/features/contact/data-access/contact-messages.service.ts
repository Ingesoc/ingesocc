import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../core/supabase.service';

export type LeadStatus = 'new' | 'contacted' | 'closed';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  project_type: string | null;
  budget_range: string | null;
  timeline: string | null;
  status: LeadStatus;
  is_spam: boolean;
  website: string | null;
  read: boolean;
  created_at: string;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  project_type?: string | null;
  budget_range?: string | null;
  timeline?: string | null;
  /** Honeypot anti-spam: el formulario real lo envía siempre vacío. */
  website?: string;
}

/**
 * Mensajes del formulario de contacto (tabla `contact_messages`, plan 3.5).
 * RLS: insert público (cualquiera puede enviar), select/update solo admin.
 */
@Injectable({ providedIn: 'root' })
export class ContactMessagesService {
  private readonly supabase = inject(SupabaseService);

  private readonly messagesSignal = signal<ContactMessage[]>([]);

  readonly messages = this.messagesSignal.asReadonly();
  readonly unreadCount = computed(() => this.messagesSignal().filter((message) => !message.read).length);

  /**
   * Carga la bandeja (solo admin por RLS). Lanza en caso de error para que la
   * UI (dashboard/bandeja) muestre su estado de error en lugar de dejar la
   * señal vacía como si no hubiera mensajes.
   */
  async load(): Promise<void> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    this.messagesSignal.set((data ?? []) as ContactMessage[]);
  }

  /**
   * Inserta un mensaje enviado desde el formulario público (RLS permite insert;
   * el trigger `contact_messages_lead_guard` marca spam o descarta por rate limit).
   */
  async insert(input: ContactMessageInput): Promise<void> {
    await this.supabase.clientPromise;
    const payload = {
      name: input.name,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
      project_type: input.project_type ?? null,
      budget_range: input.budget_range ?? null,
      timeline: input.timeline ?? null,
      // El honeypot llega como string vacío cuando es humano; vacío se envía
      // igual (no null) para respetar el contrato del trigger con la columna.
      website: input.website ?? '',
    };
    const { error } = await this.supabase.client.from('contact_messages').insert(payload);
    if (error) throw new Error(error.message);
  }

  /** Cambia el estado de gestión del lead (nuevo/contactado/cerrado). Solo admin por RLS. */
  async setStatus(id: string, status: LeadStatus): Promise<void> {
    await this.supabase.clientPromise;
    const { error } = await this.supabase.client
      .from('contact_messages')
      .update({ status })
      .eq('id', id);
    if (error) throw new Error(error.message);
    this.messagesSignal.update((list) => list.map((m) => (m.id === id ? { ...m, status } : m)));
  }

  /** Marca un mensaje como leído o no leído (solo admin por RLS). */
  async setRead(id: string, read: boolean): Promise<void> {
    await this.supabase.clientPromise;
    const { error } = await this.supabase.client.from('contact_messages').update({ read }).eq('id', id);
    if (error) throw new Error(error.message);
    this.messagesSignal.update((list) => list.map((m) => (m.id === id ? { ...m, read } : m)));
  }

  /** Elimina un mensaje (solo admin por RLS). */
  async remove(id: string): Promise<void> {
    await this.supabase.clientPromise;
    const { error } = await this.supabase.client.from('contact_messages').delete().eq('id', id);
    if (error) throw new Error(error.message);
    this.messagesSignal.update((list) => list.filter((m) => m.id !== id));
  }
}