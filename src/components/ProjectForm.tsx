import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Send, Lightbulb, Target, Zap } from 'lucide-react';

interface ProjectFormProps {
  user: User;
  onProjectSubmitted: () => void;
}

export function ProjectForm({ user, onProjectSubmitted }: ProjectFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          title,
          description,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Project submitted!",
        description: "Your project has been submitted for AI evaluation.",
      });

      setTitle('');
      setDescription('');
      onProjectSubmitted();
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

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Target className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">Submit New Project</CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Get AI-powered evaluation and detailed feedback for your project
            </CardDescription>
          </div>
        </div>

        <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-blue-900">Tips for Success</h4>
          </div>
          <ul className="text-xs text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Provide a clear, descriptive title (at least 5 characters)</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Write a detailed description (at least 50 characters)</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Include your project's goals and objectives</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Explain the expected impact and value</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Mention any technical requirements or constraints</span>
            </li>
          </ul>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Project Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a clear, descriptive title for your project"
              required
              className="border-gray-200 focus:border-blue-400 focus:ring-blue-400 transition-colors"
            />
            <p className="text-xs text-gray-500">Make it specific and engaging</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Project Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project in detail. Include goals, objectives, technical approach, expected impact, and any constraints or requirements..."
              rows={8}
              required
              className="border-gray-200 focus:border-blue-400 focus:ring-blue-400 transition-colors resize-none"
            />
            <p className="text-xs text-gray-500">
              Be comprehensive - the more detail you provide, the better the AI evaluation will be
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] py-3"
          >
            {loading ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-pulse" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit for AI Evaluation
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}