import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Loader2, RefreshCw } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  ai_feedback: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectsListProps {
  user: User;
  refreshTrigger: number;
}

export function ProjectsList({ user, refreshTrigger }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects((data || []) as Project[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerEvaluation = async (projectId: string) => {
    setEvaluatingId(projectId);
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-project', {
        body: { projectId }
      });

      if (error) throw error;

      toast({
        title: "Evaluation complete!",
        description: `Project has been ${data.newStatus}`,
      });

      await fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to evaluate project",
        variant: "destructive",
      });
    } finally {
      setEvaluatingId(null);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user.id, refreshTrigger]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const parseFeedback = (feedback: string | null) => {
    if (!feedback) return null;
    try {
      return JSON.parse(feedback);
    } catch {
      return { feedback: feedback, suggestions: [] };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Projects</h2>
        <Button variant="outline" onClick={fetchProjects}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No projects submitted yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {projects.map((project) => {
            const feedback = parseFeedback(project.ai_feedback);
            
            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{project.title}</CardTitle>
                      <CardDescription className="mt-2">
                        Submitted on {new Date(project.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.toUpperCase()}
                      </Badge>
                      {project.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => triggerEvaluation(project.id)}
                          disabled={evaluatingId === project.id}
                        >
                          {evaluatingId === project.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Evaluating...
                            </>
                          ) : (
                            'Evaluate with AI'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                  
                  {feedback && (
                    <div>
                      <h4 className="font-medium mb-2">AI Feedback</h4>
                      <p className="text-sm text-muted-foreground mb-3">{feedback.feedback}</p>
                      
                      {feedback.suggestions && feedback.suggestions.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">Suggestions for Improvement:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {feedback.suggestions.map((suggestion: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}