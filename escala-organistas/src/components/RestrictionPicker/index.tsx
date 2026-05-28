import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonDatetime,
  IonButtons,
  IonIcon,
} from '@ionic/react';
import { checkmarkOutline, closeOutline } from 'ionicons/icons';
import { Restriction, WEEKDAY_NAMES_FULL } from '../../models/types';
import { createRestriction } from '../../services/storage.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (restrictions: Restriction[]) => void;
}

const RestrictionPicker: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
  const [mode, setMode] = useState<'weekday' | 'specific_date'>('weekday');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const toggleWeekday = (wd: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(wd) ? prev.filter((w) => w !== wd) : [...prev, wd],
    );
  };

  const handleAdd = () => {
    const restrictions: Restriction[] = [];
    if (mode === 'weekday') {
      for (const wd of selectedWeekdays) {
        restrictions.push(createRestriction('weekday', wd));
      }
    } else if (selectedDate) {
      const dateStr = selectedDate.slice(0, 10);
      restrictions.push(createRestriction('specific_date', undefined, dateStr));
    }
    if (restrictions.length > 0) {
      onAdd(restrictions);
      setSelectedWeekdays([]);
      setSelectedDate('');
    }
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} breakpoints={[0, 0.5, 0.9]} initialBreakpoint={0.5}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Adicionar Restrição</IonTitle>
          <IonButtons slot="end">
            <IonButton
              strong
              onClick={handleAdd}
              disabled={
                (mode === 'weekday' && selectedWeekdays.length === 0) ||
                (mode === 'specific_date' && !selectedDate)
              }
            >
              <IonIcon slot="start" icon={checkmarkOutline} />
              Adicionar
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonSegment
          value={mode}
          onIonChange={(e) => setMode(e.detail.value as 'weekday' | 'specific_date')}
          style={{ marginBottom: 16 }}
        >
          <IonSegmentButton value="weekday">
            <IonLabel>Dia da Semana</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="specific_date">
            <IonLabel>Data Específica</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {mode === 'weekday' && (
          <>
            <p style={{ color: 'var(--ion-color-medium)', marginBottom: 12 }}>
              Selecione os dias em que a organista <strong>não pode</strong> tocar:
            </p>
            <IonGrid>
              <IonRow>
                {WEEKDAY_NAMES_FULL.map((name, i) => (
                  <IonCol size="6" key={i}>
                    <IonButton
                      expand="block"
                      fill={selectedWeekdays.includes(i) ? 'solid' : 'outline'}
                      color={selectedWeekdays.includes(i) ? 'danger' : 'medium'}
                      onClick={() => toggleWeekday(i)}
                      style={{ marginBottom: 8 }}
                    >
                      {name}
                    </IonButton>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </>
        )}

        {mode === 'specific_date' && (
          <>
            <p style={{ color: 'var(--ion-color-medium)', marginBottom: 12 }}>
              Selecione a data específica:
            </p>
            <IonDatetime
              presentation="date"
              value={selectedDate || undefined}
              onIonChange={(e) => setSelectedDate(e.detail.value as string)}
              style={{ margin: '0 auto' }}
            />
          </>
        )}
      </IonContent>
    </IonModal>
  );
};

export default RestrictionPicker;
