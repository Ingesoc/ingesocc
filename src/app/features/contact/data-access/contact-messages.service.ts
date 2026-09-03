import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../core/supabase.service';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
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

  /** Carga la bandeja (solo admin por RLS). */
  async load(): Promise<void> {
    await this.supabase.clientPromise;
    const { data, error } = await this.supabase.client
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[mensajes] sin datos:', error.message);
      return;
    }
    this.messagesSignal.set((data ?? []) as ContactMessage[]);
  }

  /** Inserta un mensaje enviado desde el formulario público (RLS permite insert). */
  async insert(input: ContactMessageInput): Promise<void> {
    await this.supabase.clientPromise;
    const { error } = await this.supabase.client.from('contact_messages').insert(input);
    if (error) throw new Error(error.message);
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