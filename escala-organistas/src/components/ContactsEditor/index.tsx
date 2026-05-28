import React, { useState } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonReorderGroup,
  IonReorder,
  IonAlert,
  IonNote,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonToast,
  ItemReorderEventDetail,
} from '@ionic/react';
import { addOutline, trashOutline, reorderThreeOutline, checkmarkOutline } from 'ionicons/icons';
import { Contact } from '../../models/types';
import { generateId, stripEmoji } from '../../services/storage.service';

// Formats digits as XXXXX-XXXX (Brazilian 9-digit mobile pattern).
// Strips non-digits, caps at 9 digits, inserts dash after position 5.
function applyPhoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length < 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

interface Props {
  contacts: Contact[];
  onChange: (contacts: Contact[]) => void;
}

const ContactsEditor: React.FC<Props> = ({ contacts, onChange }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPhone2, setNewPhone2] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const handleReorder = (e: CustomEvent<ItemReorderEventDetail>) => {
    const updated = [...contacts];
    const [moved] = updated.splice(e.detail.from, 1);
    updated.splice(e.detail.to, 0, moved);
    onChange(updated);
    e.detail.complete();
  };

  const updateContact = (id: string, patch: Partial<Contact>) => {
    if (patch.name !== undefined) {
      const trimmed = patch.name.trim();
      if (trimmed) {
        const dup = contacts.find(
          (c) => c.id !== id && c.name.trim().toLowerCase() === trimmed.toLowerCase()
        );
        if (dup) { setToastMsg('Já existe um contato com este nome.'); return; }
      }
    }
    if (patch.phone !== undefined) {
      const trimmed = patch.phone.trim();
      if (trimmed) {
        const dup = contacts.find(
          (c) => c.id !== id &&
            ((c.phone.trim() && c.phone.trim() === trimmed) ||
              (c.phone2?.trim() && c.phone2.trim() === trimmed))
        );
        if (dup) { setToastMsg(`Número já cadastrado em: ${dup.name}`); return; }
      }
    }
    if (patch.phone2 !== undefined) {
      const trimmed = patch.phone2.trim();
      if (trimmed) {
        const dup = contacts.find(
          (c) => c.id !== id &&
            ((c.phone.trim() && c.phone.trim() === trimmed) ||
              (c.phone2?.trim() && c.phone2.trim() === trimmed))
        );
        if (dup) { setToastMsg(`Número já cadastrado em: ${dup.name}`); return; }
      }
    }
    onChange(contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const deleteContact = () => {
    if (!deleteId) return;
    onChange(contacts.filter((c) => c.id !== deleteId));
    setDeleteId(null);
  };

  const addContact = () => {
    const trimmedName = newName.trim();
    const trimmedPhone = newPhone.trim();
    const trimmedPhone2 = newPhone2.trim();

    if (!trimmedName) { setToastMsg('Informe o nome do contato.'); return; }
    if (!trimmedPhone) { setToastMsg('Informe o telefone principal.'); return; }

    const dupName = contacts.find(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (dupName) { setToastMsg('Já existe um contato com este nome.'); return; }

    const dupPhone = contacts.find(
      (c) =>
        (c.phone.trim() && c.phone.trim() === trimmedPhone) ||
        (c.phone2?.trim() && c.phone2.trim() === trimmedPhone)
    );
    if (dupPhone) { setToastMsg(`Número já cadastrado em: ${dupPhone.name}`); return; }

    if (trimmedPhone2) {
      const dupPhone2 = contacts.find(
        (c) =>
          (c.phone.trim() && c.phone.trim() === trimmedPhone2) ||
          (c.phone2?.trim() && c.phone2.trim() === trimmedPhone2)
      );
      if (dupPhone2) { setToastMsg(`Número já cadastrado em: ${dupPhone2.name}`); return; }
    }

    const c: Contact = {
      id: generateId(),
      name: trimmedName,
      phone: trimmedPhone,
      phone2: trimmedPhone2 || undefined,
    };
    onChange([...contacts, c]);
    setNewName('');
    setNewPhone('');
    setNewPhone2('');
    setShowAdd(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <IonButton size="small" fill="outline" onClick={() => setShowAdd(true)}>
          <IonIcon slot="start" icon={addOutline} />
          Adicionar
        </IonButton>
      </div>

      <IonNote style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
        Arraste o ícone para reordenar. Toque no nome/telefone para editar.
      </IonNote>

      <IonList>
        <IonReorderGroup disabled={false} onIonItemReorder={handleReorder}>
          {contacts.map((c) => (
            <IonItem key={c.id} lines="full">
              <IonReorder slot="start" />
              <IonLabel style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <IonInput
                  value={c.name}
                  onIonInput={(e) => updateContact(c.id, { name: stripEmoji(e.detail.value ?? '') })}
                  placeholder="Nome"
                  style={{ fontSize: 14, fontWeight: 600 }}
                />
                <IonInput
                  value={c.phone}
                  onIonInput={(e) => updateContact(c.id, { phone: applyPhoneMask(stripEmoji(e.detail.value ?? '')) })}
                  placeholder="Telefone"
                  type="tel"
                  style={{ fontSize: 13 }}
                />
                <IonInput
                  value={c.phone2 ?? ''}
                  onIonInput={(e) => updateContact(c.id, { phone2: applyPhoneMask(stripEmoji(e.detail.value ?? '')) })}
                  placeholder="Segundo telefone (opcional)"
                  type="tel"
                  style={{ fontSize: 13 }}
                />
              </IonLabel>
              <IonButton
                slot="end"
                fill="clear"
                color="danger"
                onClick={() => setDeleteId(c.id)}
              >
                <IonIcon slot="icon-only" icon={trashOutline} />
              </IonButton>
            </IonItem>
          ))}
        </IonReorderGroup>
      </IonList>

      <IonModal isOpen={showAdd} onDidDismiss={() => setShowAdd(false)} breakpoints={[0, 0.55]} initialBreakpoint={0.55}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Novo Contato</IonTitle>
            <IonButtons slot="end">
              <IonButton strong onClick={addContact} disabled={!newName.trim() || !newPhone.trim()}>
                <IonIcon slot="start" icon={checkmarkOutline} />
                Adicionar
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem>
            <IonLabel position="stacked">Nome *</IonLabel>
            <IonInput value={newName} onIonInput={(e) => setNewName(stripEmoji(e.detail.value ?? ''))} placeholder="Ex: Ir. FULANO" clearInput />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Telefone *</IonLabel>
            <IonInput value={newPhone} onIonInput={(e) => setNewPhone(applyPhoneMask(stripEmoji(e.detail.value ?? '')))} type="tel" placeholder="99999-9999" clearInput />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Segundo Telefone (opcional)</IonLabel>
            <IonInput value={newPhone2} onIonInput={(e) => setNewPhone2(applyPhoneMask(stripEmoji(e.detail.value ?? '')))} type="tel" placeholder="99999-9999" clearInput />
          </IonItem>
        </IonContent>
      </IonModal>

      <IonAlert
        isOpen={!!deleteId}
        header="Remover Contato"
        message="Confirma remoção deste contato?"
        buttons={[
          { text: 'Cancelar', role: 'cancel', handler: () => setDeleteId(null) },
          { text: 'Remover', role: 'destructive', handler: deleteContact },
        ]}
        onDidDismiss={() => setDeleteId(null)}
      />

      <IonToast
        isOpen={!!toastMsg}
        message={toastMsg}
        duration={2500}
        color="warning"
        onDidDismiss={() => setToastMsg('')}
      />
    </div>
  );
};

export default ContactsEditor;
