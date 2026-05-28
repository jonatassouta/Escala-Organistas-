import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonChip,
  IonNote,
  IonToast,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import { addOutline, closeOutline, saveOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import {
  getOrganists,
  saveOrganist,
  createOrganist,
  stripEmoji,
} from '../../services/storage.service';
import { Organist, OrganistRole, Restriction, WEEKDAY_NAMES } from '../../models/types';
import RestrictionPicker from '../../components/RestrictionPicker';

const OrganistForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const history = useHistory();
  const isNew = !id;

  const [name, setName] = useState('');
  const [role, setRole] = useState<OrganistRole>('ambos');
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (!isNew) {
      getOrganists().then((list) => {
        const found = list.find((o) => o.id === id);
        if (found) {
          setName(found.name);
          setRole(found.role ?? 'ambos');
          setRestrictions(found.restrictions);
        }
      });
    }
  }, [id]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setToastMsg('Informe o nome da organista.');
      setShowToast(true);
      return;
    }

    const allOrganists = await getOrganists();
    const duplicate = allOrganists.find(
      (o) => o.name.trim().toLowerCase() === trimmed.toLowerCase() && o.id !== id
    );
    if (duplicate) {
      setToastMsg('Já existe uma organista com este nome.');
      setShowToast(true);
      return;
    }

    const organist: Organist = isNew
      ? { ...createOrganist(trimmed), role, restrictions }
      : { id: id!, name: trimmed, role, restrictions };

    await saveOrganist(organist);
    history.goBack();
  };

  const handleAddRestrictions = (newOnes: Restriction[]) => {
    setRestrictions((prev) => [...prev, ...newOnes]);
  };

  const removeRestriction = (rid: string) => {
    setRestrictions((prev) => prev.filter((r) => r.id !== rid));
  };

  function restrictionLabel(r: Restriction): string {
    if (r.type === 'weekday') return WEEKDAY_NAMES[r.weekday ?? 0];
    if (r.type === 'specific_date' && r.date) {
      const [y, m, d] = r.date.split('-');
      return `${d}/${m}/${y}`;
    }
    return r.label ?? '';
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/organistas" />
          </IonButtons>
          <IonTitle>{isNew ? 'Nova Organista' : 'Editar Organista'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} strong>
              <IonIcon slot="start" icon={saveOutline} />
              Salvar
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonItem lines="full" style={{ marginBottom: 16 }}>
          <IonLabel position="stacked">Nome</IonLabel>
          <IonInput
            value={name}
            onIonInput={(e) => setName(stripEmoji(e.detail.value ?? ''))}
            placeholder="Nome da organista"
            clearInput
          />
        </IonItem>

        <div style={{ marginBottom: 16 }}>
          <IonLabel style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', display: 'block', marginBottom: 8, paddingLeft: 4 }}>
            Tipo de escala
          </IonLabel>
          <IonSegment
            value={role}
            onIonChange={(e) => setRole(e.detail.value as OrganistRole)}
          >
            <IonSegmentButton value="RJM">
              <IonLabel>RJM</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="CO">
              <IonLabel>CO</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="ambos">
              <IonLabel>Ambos</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <IonLabel>
              <h2 style={{ fontWeight: 600 }}>Restrições de dias</h2>
              <IonNote>Dias em que a organista NÃO pode tocar</IonNote>
            </IonLabel>
            <IonButton size="small" fill="outline" onClick={() => setShowPicker(true)}>
              <IonIcon slot="start" icon={addOutline} />
              Adicionar
            </IonButton>
          </div>

          {restrictions.length === 0 ? (
            <p style={{ color: 'var(--ion-color-medium)', fontSize: 14, marginLeft: 4 }}>
              Nenhuma restrição adicionada.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {restrictions.map((r) => (
                <IonChip key={r.id} color="danger" onClick={() => removeRestriction(r.id)}>
                  <IonLabel>{restrictionLabel(r)}</IonLabel>
                  <IonIcon icon={closeOutline} />
                </IonChip>
              ))}
            </div>
          )}
        </div>

        <IonNote style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
          Toque em uma restrição para removê-la.
        </IonNote>
      </IonContent>

      <RestrictionPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onAdd={handleAddRestrictions}
      />

      <IonToast
        isOpen={showToast}
        message={toastMsg}
        duration={2000}
        onDidDismiss={() => setShowToast(false)}
        color="warning"
      />
    </IonPage>
  );
};

export default OrganistForm;
