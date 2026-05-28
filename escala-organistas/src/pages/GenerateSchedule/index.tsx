import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner,
  IonToast,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonAlert,
  IonDatetime,
  IonModal,
} from '@ionic/react';
import {
  calendarOutline,
  shareOutline,
  warningOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import {
  getOrganists,
  getSettings,
  getRotationState,
  saveSchedule,
  saveRotationState,
} from '../../services/storage.service';
import { generateSchedule, getNextMonth, getTrimesterLabel } from '../../services/schedule.service';
import { generateAndSharePDF } from '../../services/pdf.service';
import { GeneratedSchedule, AppSettings, MONTH_NAMES_SHORT } from '../../models/types';
import CalendarGrid from '../../components/CalendarGrid';

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTH_NAMES_SHORT[parseInt(m, 10) - 1]}/${y}`;
}

function get3MonthsRange(startMonth: string): string {
  const [yearStr, monthStr] = startMonth.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10) - 1;
  return Array.from({ length: 3 }, (_, i) => {
    const mo = (m + i) % 12;
    const yr = y + Math.floor((m + i) / 12);
    return `${MONTH_NAMES_SHORT[mo]}/${yr}`;
  }).join(' • ');
}

const GenerateSchedule: React.FC = () => {
  const [startMonth, setStartMonth] = useState(getNextMonth());
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleGenerate = async () => {
    if (!settings) return;
    setGenerating(true);
    try {
      const [organists, rotationState] = await Promise.all([
        getOrganists(),
        getRotationState(),
      ]);

      if (organists.length === 0) {
        setToastMsg('Cadastre ao menos uma organista antes de gerar a escala.');
        setShowToast(true);
        return;
      }

      const { schedule: newSchedule, newRotationState } = generateSchedule(
        startMonth,
        organists,
        settings,
        rotationState,
      );

      await Promise.all([
        saveSchedule(newSchedule),
        saveRotationState(newRotationState),
      ]);

      setSchedule(newSchedule);

      if (newSchedule.warnings.length > 0) {
        setShowWarnings(true);
      } else {
        setToastMsg('Escala gerada com sucesso!');
        setShowToast(true);
      }
    } catch (e) {
      console.error(e);
      setToastMsg('Erro ao gerar escala. Tente novamente.');
      setShowToast(true);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!schedule || !settings) return;
    setSharing(true);
    try {
      await generateAndSharePDF(schedule, settings);
    } catch (e) {
      console.error(e);
      setToastMsg('Erro ao gerar/compartilhar PDF.');
      setShowToast(true);
    } finally {
      setSharing(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Gerar Escala</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Mês Inicial</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonNote style={{ display: 'block', marginBottom: 8 }}>
              A escala será gerada para 3 meses consecutivos a partir do mês selecionado.
            </IonNote>
            <IonItem button onClick={() => setShowMonthPicker(true)} lines="none">
              <IonIcon icon={calendarOutline} slot="start" color="primary" />
              <IonLabel>
                <h2>{getTrimesterLabel(startMonth)}</h2>
                <p>{get3MonthsRange(startMonth)}</p>
              </IonLabel>
              <IonIcon icon={chevronForwardOutline} slot="end" color="medium" />
            </IonItem>

            <IonButton
              expand="block"
              onClick={handleGenerate}
              disabled={generating || !settings}
              style={{ marginTop: 12 }}
            >
              {generating ? (
                <>
                  <IonSpinner name="crescent" style={{ marginRight: 8 }} />
                  Gerando...
                </>
              ) : (
                <>
                  <IonIcon slot="start" icon={calendarOutline} />
                  Gerar Escala
                </>
              )}
            </IonButton>
          </IonCardContent>
        </IonCard>

        {schedule && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 8px' }}>
              <h3 style={{ margin: 0, color: 'var(--ion-color-primary)' }}>
                {getTrimesterLabel(schedule.startMonth)}
              </h3>
              <IonButton
                fill="solid"
                color="success"
                onClick={handleShare}
                disabled={sharing}
                size="small"
              >
                {sharing ? (
                  <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
                ) : (
                  <>
                    <IonIcon slot="start" icon={shareOutline} />
                    Exportar PDF
                  </>
                )}
              </IonButton>
            </div>

            {schedule.warnings.length > 0 && (
              <IonItem
                color="warning"
                button
                onClick={() => setShowWarnings(true)}
                style={{ borderRadius: 8, marginBottom: 12 }}
              >
                <IonIcon icon={warningOutline} slot="start" />
                <IonLabel>
                  {schedule.warnings.length} aviso(s) de conflito — toque para ver
                </IonLabel>
              </IonItem>
            )}

            <CalendarGrid
              startMonth={schedule.startMonth}
              assignments={schedule.assignments}
            />

            <IonButton
              expand="block"
              fill="solid"
              color="success"
              onClick={handleShare}
              disabled={sharing}
              style={{ marginTop: 16, marginBottom: 32 }}
            >
              {sharing ? (
                <IonSpinner name="crescent" style={{ width: 20, height: 20, marginRight: 8 }} />
              ) : (
                <IonIcon slot="start" icon={shareOutline} />
              )}
              Exportar PDF
            </IonButton>
          </>
        )}
      </IonContent>

      {/* Month picker modal */}
      <IonModal
        isOpen={showMonthPicker}
        onDidDismiss={() => setShowMonthPicker(false)}
        breakpoints={[0, 0.6]}
        initialBreakpoint={0.6}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Selecionar Mês Inicial</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowMonthPicker(false)} strong>
                OK
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonDatetime
            presentation="month-year"
            value={`${startMonth}-01`}
            onIonChange={(e) => {
              const val = (e.detail.value as string).slice(0, 7);
              setStartMonth(val);
              setSchedule(null);
            }}
            style={{ margin: '0 auto' }}
          />
        </IonContent>
      </IonModal>

      {/* Warnings alert */}
      <IonAlert
        isOpen={showWarnings}
        header={`${schedule?.warnings.length ?? 0} Aviso(s) de Conflito`}
        message={schedule?.warnings.join('\n\n') ?? ''}
        buttons={[{ text: 'OK', role: 'cancel' }]}
        onDidDismiss={() => setShowWarnings(false)}
      />

      <IonToast
        isOpen={showToast}
        message={toastMsg}
        duration={3000}
        onDidDismiss={() => setShowToast(false)}
      />
    </IonPage>
  );
};

export default GenerateSchedule;
