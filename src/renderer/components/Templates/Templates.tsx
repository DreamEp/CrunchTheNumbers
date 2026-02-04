import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { SessionTemplate } from '../../../shared/types';
import {
  Card,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  FormGroup,
  Textarea,
  SectionHeader,
  Modal,
  ModalTitle,
  ModalDescription,
  ModalActions,
  EmptyState,
} from '../ui';

function Templates() {
  const { sessionTemplates, addTemplate, updateTemplate, deleteTemplate, reorderTemplates } =
    useAppStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    defaultDuration: '',
  });

  const [editingTemplate, setEditingTemplate] = useState<SessionTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name.trim()) return;

    await addTemplate({
      name: newTemplate.name.trim(),
      description: newTemplate.description.trim() || undefined,
      defaultDuration: newTemplate.defaultDuration
        ? parseInt(newTemplate.defaultDuration)
        : undefined,
    });

    setNewTemplate({ name: '', description: '', defaultDuration: '' });
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    await updateTemplate(editingTemplate.id, {
      name: editingTemplate.name,
      description: editingTemplate.description,
      defaultDuration: editingTemplate.defaultDuration,
    });

    setEditingTemplate(null);
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
    setDeleteConfirm(null);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      await reorderTemplates(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-8">
      {/* Formulaire ajout template */}
      <Card>
        <SectionHeader icon="📋" title="Ajouter une séance type" />
        <form onSubmit={handleAddTemplate} className="space-y-4">
          <FormGroup>
            <Label>Nom de la séance *</Label>
            <Input
              type="text"
              required
              value={newTemplate.name}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, name: e.target.value })
              }
              placeholder="Ex: Cardio intensif, Renforcement musculaire..."
            />
          </FormGroup>
          <FormGroup>
            <Label>Description</Label>
            <Textarea
              value={newTemplate.description}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, description: e.target.value })
              }
              rows={3}
              placeholder="Détails de la séance, exercices types, matériel nécessaire..."
            />
          </FormGroup>
          <FormGroup>
            <Label>Durée par défaut (minutes)</Label>
            <Input
              type="number"
              min="15"
              max="180"
              step="15"
              value={newTemplate.defaultDuration}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, defaultDuration: e.target.value })
              }
              placeholder="60"
              className="w-28"
            />
          </FormGroup>
          <div className="pt-2">
            <Button type="submit" variant="primary">
              + Ajouter la séance type
            </Button>
          </div>
        </form>
      </Card>

      {/* Liste des templates */}
      <Card noPadding>
        <CardHeader>
          <div>
            <CardTitle>
              📋 Séances types
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-accentMuted text-accent">
                {sessionTemplates.length}
              </span>
            </CardTitle>
            <p className="text-sm mt-1 text-muted">
              Référentiel des types de séances proposées
            </p>
          </div>
        </CardHeader>

        {sessionTemplates.length === 0 ? (
          <EmptyState
            icon="📋"
            message="Aucune séance type définie. Créez-en une ci-dessus."
          />
        ) : (
          <div className="divide-y divide-border">
            {sessionTemplates.map((template, index) => (
              <div
                key={template.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`px-6 py-5 transition-colors hover:bg-overlay/30 cursor-grab active:cursor-grabbing ${
                  draggedIndex === index ? 'opacity-50 bg-overlay/50' : ''
                } ${
                  dragOverIndex === index ? 'bg-accentMuted border-t-2 border-accent' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Drag handle */}
                    <div className="flex-shrink-0 mt-1 text-muted cursor-grab active:cursor-grabbing select-none">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0 bg-accent" />
                        {template.name}
                      </h3>
                      {template.defaultDuration && (
                        <p className="text-sm mt-1 flex items-center gap-1 text-muted">
                          ⏱️ {template.defaultDuration} minutes
                        </p>
                      )}
                      {template.description && (
                        <p className="text-sm mt-2 whitespace-pre-line text-subtext">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTemplate({ ...template })}
                    >
                      ✏️ Modifier
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteConfirm(template.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal édition template */}
      <Modal
        open={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        maxWidth="lg"
      >
        <ModalTitle>✏️ Modifier la séance type</ModalTitle>
        <div className="space-y-4">
          <FormGroup>
            <Label>Nom de la séance</Label>
            <Input
              type="text"
              value={editingTemplate?.name || ''}
              onChange={(e) =>
                setEditingTemplate(prev =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
            />
          </FormGroup>
          <FormGroup>
            <Label>Description</Label>
            <Textarea
              value={editingTemplate?.description || ''}
              onChange={(e) =>
                setEditingTemplate(prev =>
                  prev ? { ...prev, description: e.target.value || undefined } : null
                )
              }
              rows={3}
            />
          </FormGroup>
          <FormGroup>
            <Label>Durée par défaut (minutes)</Label>
            <Input
              type="number"
              min="15"
              max="180"
              step="15"
              value={editingTemplate?.defaultDuration || ''}
              onChange={(e) =>
                setEditingTemplate(prev =>
                  prev
                    ? {
                        ...prev,
                        defaultDuration: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      }
                    : null
                )
              }
              className="w-28"
            />
          </FormGroup>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={() => setEditingTemplate(null)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveTemplate}>
            Enregistrer
          </Button>
        </ModalActions>
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
      >
        <ModalTitle>🗑️ Supprimer cette séance type ?</ModalTitle>
        <ModalDescription>
          Cette action est irréversible.
        </ModalDescription>
        <ModalActions>
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm && handleDeleteTemplate(deleteConfirm)}
          >
            Supprimer
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}

export default Templates;
