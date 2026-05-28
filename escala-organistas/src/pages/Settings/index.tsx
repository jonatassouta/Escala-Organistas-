import React, { useEffect, useState, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonInput,
  IonTextarea,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonToast,
  IonNote,
  IonSpinner,
  IonAlert,
} from '@ionic/react';
import { saveOutline } from 'ionicons/icons';
import { getSettings, saveSettings, getOrganists, stripEmoji, resetToDefaults } from '../../services/storage.service';
import { AppSettings, Organist, PdfFontSizes, WEEKDAY_NAMES } from '../../models/types';
import ServiceSlotsEditor from '../../components/ServiceSlotsEditor';
import ContactsEditor from '../../components/ContactsEditor';

type Tab = 'documento' | 'culto' | 'ensaio' | 'recomendacoes' | 'telefones';

const Settings: React.FC = () => {
  const [tab, setTab] = useState<Tab>('documento');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [organists, setOrganists] = useState<Organist[]>([]);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showResetAlert, setShowResetAlert] = useState(false);

  const loadData = async () => {
    const [s, o] = await Promise.all([getSettings(), getOrganists()]);
    setSettings(s);
    setOrganists(o);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await saveSettings(settings);
      setToastMsg('Configurações salvas!');
      setShowToast(true);
    } catch (e) {
      setToastMsg('Erro ao salvar configurações.');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const patch = (partialSettings: Partial<AppSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...partialSettings });
  };

  if (!settings) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}>
          <IonSpinner />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Configurações</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} strong disabled={saving}>
              {saving ? <IonSpinner name="crescent" style={{ width: 18, height: 18 }} /> : <IonIcon slot="start" icon={saveOutline} />}
              Salvar
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            scrollable
            value={tab}
            onIonChange={(e) => setTab(e.detail.value as Tab)}
          >
            <IonSegmentButton value="documento">
              <IonLabel>Documento</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="culto">
              <IonLabel>Dias de Culto</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="ensaio">
              <IonLabel>Ensaio</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="recomendacoes">
              <IonLabel>Recomendações</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="telefones">
              <IonLabel>Telefones</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* DOCUMENTO TAB */}
        {tab === 'documento' && (
          <div>
            <IonNote style={{ display: 'block', marginBottom: 12 }}>
              Informações exibidas no cabeçalho do PDF gerado.
            </IonNote>
            <IonItem lines="full">
              <IonLabel position="stacked">Título do documento</IonLabel>
              <IonInput
                value={settings.docTitle}
                onIonInput={(e) => patch({ docTitle: stripEmoji(e.detail.value ?? '') })}
                placeholder="Ex: Rodízio de Organistas"
              />
            </IonItem>
            <IonItem lines="full">
              <IonLabel position="stacked">Nome da congregação</IonLabel>
              <IonInput
                value={settings.congregationName}
                onIonInput={(e) => patch({ congregationName: stripEmoji(e.detail.value ?? '') })}
                placeholder="Ex: Parque das Hortências"
              />
            </IonItem>
            <IonItem lines="full">
              <IonLabel position="stacked">Cidade / Estado</IonLabel>
              <IonInput
                value={settings.city}
                onIonInput={(e) => patch({ city: stripEmoji(e.detail.value ?? '') })}
                placeholder="Ex: Araraquara – SP"
              />
            </IonItem>

            <IonNote style={{ display: 'block', margin: '16px 0 8px' }}>
              Tamanho das fontes no PDF gerado. Reduza se o conteúdo não couber em uma página.
            </IonNote>
            <IonItem lines="full">
              <IonLabel>Fonte do calendário</IonLabel>
              <IonSelect
                value={settings.pdfFontSizes?.calendar ?? 6}
                onIonChange={(e) =>
                  patch({ pdfFontSizes: { ...(settings.pdfFontSizes ?? { calendar: 6, recommendations: 7, contacts: 7 }), calendar: e.detail.value } })
                }
                interface="popover"
              >
                <IonSelectOption value={5}>5 pt (mínimo)</IonSelectOption>
                <IonSelectOption value={6}>6 pt (padrão)</IonSelectOption>
                <IonSelectOption value={7}>7 pt</IonSelectOption>
                <IonSelectOption value={7.5}>7.5 pt</IonSelectOption>
                <IonSelectOption value={8}>8 pt (maior)</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem lines="full">
              <IonLabel>Fonte das recomendações</IonLabel>
              <IonSelect
                value={settings.pdfFontSizes?.recommendations ?? 7}
                onIonChange={(e) =>
                  patch({ pdfFontSizes: { ...(settings.pdfFontSizes ?? { calendar: 6, recommendations: 7, contacts: 7 }), recommendations: e.detail.value } })
                }
                interface="popover"
              >
                <IonSelectOption value={6}>6 pt (mínimo)</IonSelectOption>
                <IonSelectOption value={7}>7 pt (padrão)</IonSelectOption>
                <IonSelectOption value={8}>8 pt</IonSelectOption>
                <IonSelectOption value={9}>9 pt</IonSelectOption>
                <IonSelectOption value={10}>10 pt (maior)</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem lines="full">
              <IonLabel>Fonte dos telefones</IonLabel>
              <IonSelect
                value={settings.pdfFontSizes?.contacts ?? 7}
                onIonChange={(e) =>
                  patch({ pdfFontSizes: { ...(settings.pdfFontSizes ?? { calendar: 6, recommendations: 7, contacts: 7 }), contacts: e.detail.value } })
                }
                interface="popover"
              >
                <IonSelectOption value={6}>6 pt (mínimo)</IonSelectOption>
                <IonSelectOption value={7}>7 pt (padrão)</IonSelectOption>
                <IonSelectOption value={8}>8 pt</IonSelectOption>
                <IonSelectOption value={9}>9 pt</IonSelectOption>
                <IonSelectOption value={10}>10 pt (maior)</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem lines="none" style={{ marginTop: 24 }}>
              <IonButton
                expand="block"
                color="danger"
                fill="outline"
                onClick={() => setShowResetAlert(true)}
                style={{ width: '100%' }}
              >
                Restaurar configurações padrão
              </IonButton>
            </IonItem>
          </div>
        )}

        {/* DIAS DE CULTO TAB */}
        {tab === 'culto' && (
          <div>
            <IonNote style={{ display: 'block', marginBottom: 8 }}>
              Configure os dias da semana com culto e quantos slots cada um tem.
              Slots com modo "Fixo" sempre usam a mesma organista; "Rotativo" alterna entre todas disponíveis.
            </IonNote>
            <div style={{ background: '#f4f4f4', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 12 }}>
              <strong>Legenda:</strong>{' '}
              <strong>RJM</strong> = Reunião de Jovens e Menores{' · '}
              <strong>CO</strong> = Culto Oficial
            </div>
            <IonItem lines="full" style={{ marginBottom: 12 }}>
              <IonLabel>
                <h2>Ordem sequencial</h2>
                <IonNote>
                  {settings.useStrictOrder ?? true
                    ? 'Organistas seguem uma sequência fixa (A→B→C→A…)'
                    : 'Prioriza distribuição igual de cultos por organista'}
                </IonNote>
              </IonLabel>
              <IonToggle
                slot="end"
                checked={settings.useStrictOrder ?? true}
                onIonChange={(e) => patch({ useStrictOrder: e.detail.checked })}
              />
            </IonItem>
            <ServiceSlotsEditor
              slots={settings.serviceSlots}
              organists={organists}
              onChange={(slots) => patch({ serviceSlots: slots })}
            />
          </div>
        )}

        {/* ENSAIO TAB */}
        {tab === 'ensaio' && (
          <div>
            <IonNote style={{ display: 'block', marginBottom: 12 }}>
              Define como a data do ensaio mensal é calculada automaticamente no calendário.
            </IonNote>
            <IonItem lines="full">
              <IonLabel>Marcar ensaio automaticamente</IonLabel>
              <IonToggle
                checked={settings.ensaioRule.enabled}
                onIonChange={(e) =>
                  patch({ ensaioRule: { ...settings.ensaioRule, enabled: e.detail.checked } })
                }
              />
            </IonItem>
            {settings.ensaioRule.enabled && (
              <>
                <IonItem lines="full">
                  <IonLabel>Dia da semana</IonLabel>
                  <IonSelect
                    value={settings.ensaioRule.weekday}
                    onIonChange={(e) =>
                      patch({ ensaioRule: { ...settings.ensaioRule, weekday: e.detail.value } })
                    }
                    interface="popover"
                  >
                    {WEEKDAY_NAMES.map((name, i) => (
                      <IonSelectOption key={i} value={i}>{name}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
                <IonItem lines="full">
                  <IonLabel>Ocorrência no mês</IonLabel>
                  <IonSelect
                    value={settings.ensaioRule.type === 'last_weekday' ? -1 : (settings.ensaioRule.nth ?? -1)}
                    onIonChange={(e) => {
                      const val = e.detail.value;
                      if (val === -1) {
                        patch({ ensaioRule: { ...settings.ensaioRule, type: 'last_weekday', nth: undefined } });
                      } else {
                        patch({ ensaioRule: { ...settings.ensaioRule, type: 'nth_weekday', nth: val } });
                      }
                    }}
                    interface="popover"
                  >
                    <IonSelectOption value={1}>1ª ocorrência</IonSelectOption>
                    <IonSelectOption value={2}>2ª ocorrência</IonSelectOption>
                    <IonSelectOption value={3}>3ª ocorrência</IonSelectOption>
                    <IonSelectOption value={4}>4ª ocorrência</IonSelectOption>
                    <IonSelectOption value={-1}>Última (padrão)</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </>
            )}
          </div>
        )}

        {/* RECOMENDAÇÕES TAB */}
        {tab === 'recomendacoes' && (
          <div>
            <IonNote style={{ display: 'block', marginBottom: 12 }}>
              Texto exibido na coluna direita do PDF. Pode ser editado livremente.
            </IonNote>
            <IonTextarea
              value={settings.recommendations}
              onIonInput={(e) => patch({ recommendations: stripEmoji(e.detail.value ?? '') })}
              rows={14}
              style={{
                border: '1px solid var(--ion-color-light-shade)',
                borderRadius: 8,
                padding: 8,
                fontSize: 14,
              }}
            />
          </div>
        )}

        {/* TELEFONES TAB */}
        {tab === 'telefones' && (
          <div>
            <IonNote style={{ display: 'block', marginBottom: 12 }}>
              Lista de contatos exibida na tabela do PDF. Arraste para reordenar.
            </IonNote>
            <ContactsEditor
              contacts={settings.contacts}
              onChange={(contacts) => patch({ contacts })}
            />
          </div>
        )}

        <div style={{ height: 80 }} />
      </IonContent>

      <IonToast
        isOpen={showToast}
        message={toastMsg}
        duration={2500}
        onDidDismiss={() => setShowToast(false)}
      />

      <IonAlert
        isOpen={showResetAlert}
        header="Restaurar padrão"
        message="Isso apagará todas as organistas, configurações e escalas geradas. Deseja continuar?"
        buttons={[
          { text: 'Cancelar', role: 'cancel', handler: () => setShowResetAlert(false) },
          {
            text: 'Restaurar',
            role: 'destructive',
            handler: async () => {
              await resetToDefaults();
              await loadData();
              setToastMsg('Configurações restauradas!');
              setShowToast(true);
              setShowResetAlert(false);
            },
          },
        ]}
      />
    </IonPage>
  );
};

export default Settings;
