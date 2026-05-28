import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonFab,
  IonFabButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonAlert,
  IonNote,
  IonButtons,
  IonBackButton,
  IonBadge,
} from '@ionic/react';
import { addOutline, createOutline, trashOutline, personOutline, lockClosedOutline } from 'ionicons/icons';
import { useIonRouter, useIonViewWillEnter } from '@ionic/react';
import { getOrganists, deleteOrganist } from '../../services/storage.service';
import { Organist, WEEKDAY_NAMES } from '../../models/types';

function restrictionSummary(organist: Organist): string {
  if (organist.restrictions.length === 0) return 'Sem restrições';
  const parts = organist.restrictions.map((r) => {
    if (r.type === 'weekday') return WEEKDAY_NAMES[r.weekday ?? 0];
    if (r.type === 'specific_date') {
      const [y, m, d] = (r.date ?? '').split('-');
      return `${d}/${m}/${y}`;
    }
    return '';
  });
  return parts.join(', ');
}

const Organists: React.FC = () => {
  const router = useIonRouter();
  const [organists, setOrganists] = useState<Organist[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadOrganists = async () => {
    const list = await getOrganists();
    setOrganists(list);
  };

  useIonViewWillEnter(() => {
    loadOrganists();
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteOrganist(deleteId);
    setDeleteId(null);
    loadOrganists();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Organistas</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {organists.length > 0 && (
          <IonNote style={{ display: 'block', textAlign: 'center', padding: '6px 16px', fontSize: 12 }}>
            Deslize o item para editar ou remover
          </IonNote>
        )}
        {organists.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60, color: 'var(--ion-color-medium)' }}>
            <IonIcon icon={personOutline} style={{ fontSize: 64 }} />
            <p>Nenhuma organista cadastrada.<br />Toque em + para adicionar.</p>
          </div>
        ) : (
          <IonList>
            {organists.map((o) => (
              <IonItemSliding key={o.id}>
                <IonItem button onClick={() => router.push(`/organistas/editar/${o.id}`)}>
                  <IonIcon icon={personOutline} slot="start" color="primary" />
                  <IonLabel>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {o.name}
                      <IonBadge color={(o.role ?? 'ambos') === 'RJM' ? 'tertiary' : (o.role ?? 'ambos') === 'CO' ? 'success' : 'medium'} style={{ fontSize: 10 }}>
                        {(o.role ?? 'ambos') === 'ambos' ? 'Ambos' : o.role}
                      </IonBadge>
                    </h2>
                    <IonNote style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <IonIcon icon={lockClosedOutline} style={{ fontSize: 12 }} />
                      {restrictionSummary(o)}
                    </IonNote>
                  </IonLabel>
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption
                    color="primary"
                    onClick={() => router.push(`/organistas/editar/${o.id}`)}
                  >
                    <IonIcon slot="icon-only" icon={createOutline} />
                  </IonItemOption>
                  <IonItemOption color="danger" onClick={() => setDeleteId(o.id)}>
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton routerLink="/organistas/nova">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      <IonAlert
        isOpen={!!deleteId}
        header="Excluir Organista"
        message="Tem certeza que deseja excluir esta organista? Esta ação não pode ser desfeita."
        buttons={[
          { text: 'Cancelar', role: 'cancel', handler: () => setDeleteId(null) },
          { text: 'Excluir', role: 'destructive', handler: handleDelete },
        ]}
        onDidDismiss={() => setDeleteId(null)}
      />
    </IonPage>
  );
};

export default Organists;
