import React, { useState } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonNote,
  IonAlert,
  IonBadge,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
} from '@ionic/react';
import {
  addOutline,
  trashOutline,
  settingsOutline,
  checkmarkOutline,
} from 'ionicons/icons';
import { ServiceSlot, Organist, WEEKDAY_NAMES } from '../../models/types';
import { generateId } from '../../services/storage.service';

interface Props {
  slots: ServiceSlot[];
  organists: Organist[];
  onChange: (slots: ServiceSlot[]) => void;
}

const ServiceSlotsEditor: React.FC<Props> = ({ slots, organists, onChange }) => {
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [newDow, setNewDow] = useState(0);
  const [newLabel, setNewLabel] = useState<'CO' | 'RJM' | ''>('CO');
  const [bulkMode, setBulkMode] = useState<'rotativo' | 'fixo'>('rotativo');

  const updateSlot = (idx: number, patch: Partial<ServiceSlot>) => {
    const updated = slots.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onChange(updated);
  };

  const removeSlot = (idx: number) => {
    onChange(slots.filter((_, i) => i !== idx));
    setDeleteIdx(null);
  };

  const addSlot = () => {
    const slot: ServiceSlot = {
      id: generateId(),
      dayOfWeek: newDow,
      label: newLabel.trim(),
      mode: 'rotativo',
    };
    onChange([...slots, slot]);
    setNewLabel('');
    setNewDow(0);
    setShowAddModal(false);
  };

  const applyBulkMode = () => {
    onChange(slots.map((s) => ({ ...s, mode: bulkMode, fixedOrganistId: bulkMode === 'rotativo' ? undefined : s.fixedOrganistId })));
    setShowBulkModal(false);
  };

  const dowLabel = (dow: number) => WEEKDAY_NAMES[dow];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <IonButton fill="outline" size="small" onClick={() => setShowBulkModal(true)}>
          <IonIcon slot="start" icon={settingsOutline} />
          Configurar Todos
        </IonButton>
        <IonButton fill="outline" size="small" onClick={() => setShowAddModal(true)}>
          <IonIcon slot="start" icon={addOutline} />
          Adicionar Dia
        </IonButton>
      </div>

      <IonList>
        {slots.map((slot, idx) => (
          <IonItem key={slot.id} lines="full">
            <IonLabel style={{ flex: 'none', minWidth: 60 }}>
              <strong>{dowLabel(slot.dayOfWeek)}</strong>
              {slot.label ? <IonBadge style={{ marginLeft: 6 }}>{slot.label}</IonBadge> : null}
            </IonLabel>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonNote style={{ fontSize: 13 }}>Tipo:</IonNote>
                <IonSelect
                  value={slot.label ?? ''}
                  onIonChange={(e) => updateSlot(idx, { label: e.detail.value })}
                  interface="popover"
                  style={{ minWidth: 90 }}
                >
                  <IonSelectOption value="CO">CO</IonSelectOption>
                  <IonSelectOption value="RJM">RJM</IonSelectOption>
                </IonSelect>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonNote style={{ fontSize: 13 }}>Modo:</IonNote>
                <IonSelect
                  value={slot.mode}
                  onIonChange={(e) => updateSlot(idx, { mode: e.detail.value, fixedOrganistId: undefined })}
                  interface="popover"
                  style={{ minWidth: 110 }}
                >
                  <IonSelectOption value="rotativo">Rotativo</IonSelectOption>
                  <IonSelectOption value="fixo">Fixo</IonSelectOption>
                </IonSelect>
              </div>
              {slot.mode === 'fixo' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonNote style={{ fontSize: 13 }}>Organista:</IonNote>
                  <IonSelect
                    value={slot.fixedOrganistId ?? ''}
                    onIonChange={(e) => updateSlot(idx, { fixedOrganistId: e.detail.value })}
                    interface="popover"
                    placeholder="Selecione"
                    style={{ minWidth: 140 }}
                  >
                    {organists.map((o) => (
                      <IonSelectOption key={o.id} value={o.id}>
                        {o.name}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </div>
              )}
            </div>
            <IonButton
              slot="end"
              fill="clear"
              color="danger"
              onClick={() => setDeleteIdx(idx)}
            >
              <IonIcon slot="icon-only" icon={trashOutline} />
            </IonButton>
          </IonItem>
        ))}
      </IonList>

      {/* Add slot modal */}
      <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)} breakpoints={[0, 0.5]} initialBreakpoint={0.5}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Adicionar Dia de Culto</IonTitle>
            <IonButtons slot="end">
              <IonButton strong onClick={addSlot}>
                <IonIcon slot="start" icon={checkmarkOutline} />
                Adicionar
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem>
            <IonLabel>Dia da Semana</IonLabel>
            <IonSelect
              value={newDow}
              onIonChange={(e) => setNewDow(e.detail.value)}
              interface="popover"
            >
              {WEEKDAY_NAMES.map((name, i) => (
                <IonSelectOption key={i} value={i}>{name}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel>Tipo</IonLabel>
            <IonSelect
              value={newLabel}
              onIonChange={(e) => setNewLabel(e.detail.value)}
              interface="popover"
            >
              <IonSelectOption value="CO">CO</IonSelectOption>
              <IonSelectOption value="RJM">RJM</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonContent>
      </IonModal>

      {/* Bulk mode modal */}
      <IonModal isOpen={showBulkModal} onDidDismiss={() => setShowBulkModal(false)} breakpoints={[0, 0.4]} initialBreakpoint={0.4}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Configurar Todos os Slots</IonTitle>
            <IonButtons slot="end">
              <IonButton strong onClick={applyBulkMode}>
                Aplicar
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>Definir o modo de todos os slots de culto de uma vez:</p>
          <IonItem>
            <IonLabel>Modo</IonLabel>
            <IonSelect
              value={bulkMode}
              onIonChange={(e) => setBulkMode(e.detail.value)}
              interface="popover"
            >
              <IonSelectOption value="rotativo">Rotativo (todos)</IonSelectOption>
              <IonSelectOption value="fixo">Fixo (todos)</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonNote style={{ display: 'block', marginTop: 8, padding: '0 16px', fontSize: 12 }}>
            Atenção: ao mudar para fixo, você precisará selecionar a organista de cada slot individualmente.
          </IonNote>
        </IonContent>
      </IonModal>

      <IonAlert
        isOpen={deleteIdx !== null}
        header="Remover Slot"
        message="Confirma remoção deste dia/slot de culto?"
        buttons={[
          { text: 'Cancelar', role: 'cancel', handler: () => setDeleteIdx(null) },
          { text: 'Remover', role: 'destructive', handler: () => deleteIdx !== null && removeSlot(deleteIdx) },
        ]}
        onDidDismiss={() => setDeleteIdx(null)}
      />
    </div>
  );
};

export default ServiceSlotsEditor;
