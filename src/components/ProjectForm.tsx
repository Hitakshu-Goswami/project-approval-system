import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

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
    <Card>
      <CardHeader>
        <CardTitle>Submit New Project</CardTitle>
        <CardDescription>
          Submit your project for AI-powered evaluation and approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your project title"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Project Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project in detail..."
              rows={6}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Submit Project'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}