import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { X, Save, Lightbulb, Target, Sparkles } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  ai_feedback: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectEditFormProps {
  project: Project;
  onCancel: () => void;
  onSave: () => void;
}

export function ProjectEditForm({ project, onCancel, onSave }: ProjectEditFormProps) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update the project with new title and description
      // Reset status to pending for re-evaluation
      const { error } = await supabase
        .from('projects')
        .update({
          title: title.trim(),
          description: description.trim(),
          status: 'pending',
          ai_feedback: null // Clear previous feedback
        })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Project updated!",
        description: "Your project has been updated and is ready for re-evaluation.",
      });

      onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = title.trim() !== project.title || description.trim() !== project.description;

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Edit Project
              </CardTitle>
              <CardDescription className="text-blue-700 mt-1">
                Improve your project based on AI feedback and re-evaluate for approval
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-blue-100">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-blue-900">Project Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your project title"
              required
              className="border-blue-200 focus:border-blue-400"
            />
            <p className="text-xs text-blue-600 mt-1">
              Make it descriptive and clear (at least 5 characters)
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-blue-900">Project Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project in detail..."
              rows={6}
              required
              className="border-blue-200 focus:border-blue-400"
            />
            <p className="text-xs text-blue-600 mt-1">
              Include goals, objectives, and implementation details (at least 50 characters)
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <h4 className="text-sm font-semibold text-amber-800">Improvement Tips</h4>
            </div>
            <ul className="text-xs text-amber-700 space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Be specific about your project's goals and objectives</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Explain the expected impact and value</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Mention technical requirements and implementation approach</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Address any previous feedback suggestions</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Use clear, professional language</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !hasChanges}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-pulse" />
                  <span className="animate-pulse">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save & Reset for Re-evaluation
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
