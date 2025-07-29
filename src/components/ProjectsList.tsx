import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Loader2, RefreshCw, Edit, RotateCcw, Sparkles, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { ProjectEditForm } from './ProjectEditForm';
import { MiniCelebration } from './MiniCelebration';
import { RejectionFeedback } from './RejectionFeedback';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
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
      // First try direct Gemini API call
      await directGeminiEvaluation(projectId);
    } catch (error: any) {
      console.error('Direct Gemini evaluation failed:', error);
      // Try Supabase function as fallback
      try {
        const { data, error } = await supabase.functions.invoke('evaluate-project', {
          body: { projectId }
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }

        const evaluationMethod = data.usedFallback ? ' (using basic evaluation)' : ' (using AI evaluation)';
        console.log('Evaluation response:', data);
        toast({
          title: "Evaluation complete!",
          description: `Project has been ${data.newStatus}${evaluationMethod}`,
        });

        await fetchProjects();
      } catch (supabaseError) {
        console.error('Supabase function also failed:', supabaseError);
        // Final fallback to local evaluation
        try {
          await fallbackEvaluation(projectId);
        } catch (fallbackError) {
          toast({
            title: "Evaluation Failed",
            description: "AI evaluation service is currently unavailable. Please try again later or contact support.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setEvaluatingId(null);
    }
  };

  const directGeminiEvaluation = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    console.log('Using direct Gemini API call');

    const GEMINI_API_KEY = 'AIzaSyDKcMM9_hMl_JfF0wN1PBQ6YMKvhIfiD5g';

    const prompt = `
You are an AI project evaluator. Please evaluate the following project and provide:
1. A recommendation (APPROVE or REJECT)
2. Detailed feedback explaining your decision
3. Specific suggestions for improvement if rejecting

Project Title: ${project.title}
Project Description: ${project.description}

Evaluation Criteria:
- Clarity and feasibility of the project
- Potential impact and value
- Technical soundness
- Resource requirements
- Risk assessment

Please provide your response in the following JSON format:
{
  "recommendation": "APPROVE" or "REJECT",
  "feedback": "Detailed explanation of your decision",
  "suggestions": ["suggestion 1", "suggestion 2", ...]
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error('Gemini API failed');
    }

    const geminiData = await response.json();
    const aiResponse = geminiData.candidates[0].content.parts[0].text;

    let evaluationResult;
    try {
      // Extract JSON from the response (it might be wrapped in ```json```)
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || aiResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      evaluationResult = JSON.parse(jsonString);
      console.log('Successfully parsed Gemini evaluation:', evaluationResult);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      // Fallback if AI doesn't return valid JSON
      evaluationResult = {
        recommendation: 'PENDING',
        feedback: aiResponse,
        suggestions: []
      };
    }

    // Update project with AI evaluation
    const newStatus = evaluationResult.recommendation === 'APPROVE' ? 'approved' :
                     evaluationResult.recommendation === 'REJECT' ? 'rejected' : 'pending';

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        status: newStatus,
        ai_feedback: JSON.stringify(evaluationResult)
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update project');
    }

    console.log(`Project ${projectId} evaluated with Gemini AI: ${newStatus}`);

    // Trigger appropriate feedback animation
    if (newStatus === 'approved') {
      setCelebratingId(projectId);
      // Delay the toast to let celebration show first
      setTimeout(() => {
        toast({
          title: "🎉 Congratulations!",
          description: "Your project has been approved by AI evaluation!",
        });
      }, 500);
    } else if (newStatus === 'rejected') {
      setRejectedId(projectId);
      // Delay the toast to let feedback show first
      setTimeout(() => {
        toast({
          title: "📋 Feedback Received",
          description: "Your project needs improvements. Check the feedback below!",
          variant: "destructive",
        });
      }, 500);
    } else {
      toast({
        title: "AI Evaluation complete!",
        description: `Project has been ${newStatus} (using Gemini AI)`,
      });
    }

    await fetchProjects();
  };

  const fallbackEvaluation = async (projectId: string) => {
    // Simple fallback evaluation logic
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    // Basic evaluation criteria
    const hasTitle = project.title.trim().length > 0;
    const hasDescription = project.description.trim().length > 10;
    const titleLength = project.title.trim().length;
    const descriptionLength = project.description.trim().length;

    // Simple scoring system
    let score = 0;
    const feedback = [];
    const suggestions = [];

    if (hasTitle && titleLength >= 5) {
      score += 25;
    } else {
      suggestions.push("Provide a more descriptive title (at least 5 characters)");
    }

    if (hasDescription && descriptionLength >= 50) {
      score += 25;
    } else {
      suggestions.push("Provide a more detailed description (at least 50 characters)");
    }

    if (descriptionLength >= 100) {
      score += 25;
    } else {
      suggestions.push("Add more details about your project goals and implementation");
    }

    if (project.description.toLowerCase().includes('goal') ||
        project.description.toLowerCase().includes('objective') ||
        project.description.toLowerCase().includes('purpose')) {
      score += 25;
    } else {
      suggestions.push("Clearly state your project's goals and objectives");
    }

    const recommendation = score >= 75 ? 'APPROVE' : score >= 50 ? 'PENDING' : 'REJECT';
    const status = recommendation === 'APPROVE' ? 'approved' :
                  recommendation === 'REJECT' ? 'rejected' : 'pending';

    let feedbackText = '';
    if (recommendation === 'APPROVE') {
      feedbackText = 'Your project meets the basic criteria and has been approved. Good job on providing clear details!';
    } else if (recommendation === 'PENDING') {
      feedbackText = 'Your project shows promise but needs some improvements before approval.';
    } else {
      feedbackText = 'Your project needs significant improvements before it can be approved.';
    }

    const evaluationResult = {
      recommendation,
      feedback: feedbackText,
      suggestions
    };

    // Update project in database
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        status,
        ai_feedback: JSON.stringify(evaluationResult)
      })
      .eq('id', projectId);

    if (updateError) throw updateError;

    console.log('Used frontend fallback evaluation');

    // Trigger appropriate feedback animation
    if (status === 'approved') {
      setCelebratingId(projectId);
      setTimeout(() => {
        toast({
          title: "🎉 Congratulations!",
          description: "Your project has been approved!",
        });
      }, 500);
    } else if (status === 'rejected') {
      setRejectedId(projectId);
      setTimeout(() => {
        toast({
          title: "📋 Feedback Received",
          description: "Your project needs improvements. Check the feedback below!",
          variant: "destructive",
        });
      }, 500);
    } else {
      toast({
        title: "Evaluation complete!",
        description: `Project has been ${status} (using basic evaluation)`,
      });
    }

    await fetchProjects();
  };

  const handleEditProject = (projectId: string) => {
    setEditingId(projectId);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async () => {
    setEditingId(null);
    await fetchProjects();
  };

  const resetProjectForReEvaluation = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'pending',
          ai_feedback: null
        })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Project reset!",
        description: "Your project is now ready for re-evaluation.",
      });

      await fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reset project",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user.id, refreshTrigger]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm hover:bg-emerald-100 transition-colors',
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          text: 'APPROVED'
        };
      case 'rejected':
        return {
          className: 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm hover:bg-rose-100 transition-colors',
          icon: <XCircle className="h-3 w-3 mr-1" />,
          text: 'REJECTED'
        };
      case 'pending':
        return {
          className: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm hover:bg-amber-100 transition-colors',
          icon: <Clock className="h-3 w-3 mr-1" />,
          text: 'PENDING'
        };
      default:
        return {
          className: 'bg-gray-50 text-gray-700 border-gray-200 shadow-sm hover:bg-gray-100 transition-colors',
          icon: <Clock className="h-3 w-3 mr-1" />,
          text: status.toUpperCase()
        };
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
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Projects</h2>
          <p className="text-gray-600 text-sm">Manage and evaluate your project submissions</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchProjects}
          className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-16 px-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 text-center max-w-md">
              Start by submitting your first project above. Our AI will evaluate it and provide detailed feedback to help you succeed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {projects.map((project) => {
            const feedback = parseFeedback(project.ai_feedback);

            // Show edit form if this project is being edited
            if (editingId === project.id) {
              return (
                <ProjectEditForm
                  key={project.id}
                  project={project}
                  onCancel={handleCancelEdit}
                  onSave={handleSaveEdit}
                />
              );
            }

            return (
              <Card key={project.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                          {project.title}
                        </CardTitle>
                        {project.updated_at !== project.created_at && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 shadow-sm">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Updated
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm text-gray-600 leading-relaxed">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          Submitted {new Date(project.created_at).toLocaleDateString()}
                          {project.updated_at !== project.created_at && (
                            <span className="text-blue-600 ml-2 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Updated {new Date(project.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const statusBadge = getStatusBadge(project.status);
                        return (
                          <Badge className={statusBadge.className}>
                            {statusBadge.icon}
                            {statusBadge.text}
                          </Badge>
                        );
                      })()}

                      {/* Celebration area for approved projects */}
                      {project.status === 'approved' && (
                        <MiniCelebration
                          isActive={celebratingId === project.id}
                          onComplete={() => setCelebratingId(null)}
                          duration={2500}
                        />
                      )}

                      {/* Feedback area for rejected projects */}
                      {project.status === 'rejected' && (
                        <RejectionFeedback
                          isActive={rejectedId === project.id}
                          onComplete={() => setRejectedId(null)}
                          duration={2500}
                        />
                      )}

                      {/* Action buttons based on status */}
                      <div className="flex flex-col gap-3">
                        {project.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => triggerEvaluation(project.id)}
                            disabled={evaluatingId === project.id}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                          >
                            {evaluatingId === project.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                <span className="animate-pulse">AI Evaluating...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Evaluate with Gemini AI
                              </>
                            )}
                          </Button>
                        )}

                        {(project.status === 'rejected' || project.status === 'pending') && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProject(project.id)}
                              disabled={evaluatingId === project.id}
                              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            {project.status === 'rejected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resetProjectForReEvaluation(project.id)}
                                disabled={evaluatingId === project.id}
                                title="Reset to pending without editing"
                                className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}

                        {project.status === 'pending' && (
                          <div className="text-center">
                            <p className="text-xs text-amber-600 font-medium flex items-center justify-center gap-1">
                              <Zap className="h-3 w-3" />
                              Ready for AI evaluation
                            </p>
                          </div>
                        )}

                        {project.status === 'rejected' && (
                          <div className="text-center">
                            <p className="text-xs text-rose-600 font-medium flex items-center justify-center gap-1">
                              <Edit className="h-3 w-3" />
                              Needs improvement
                            </p>
                          </div>
                        )}

                        {project.status === 'approved' && (
                          <div className="text-center">
                            <p className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Successfully approved
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Project Description
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{project.description}</p>
                  </div>
                  
                  {feedback && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">AI Evaluation Results</h4>
                      </div>

                      <div className="bg-white/70 rounded-lg p-4 mb-4 border border-blue-100">
                        <p className="text-sm text-gray-700 leading-relaxed">{feedback.feedback}</p>
                      </div>

                      {feedback.suggestions && feedback.suggestions.length > 0 && (
                        <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            Improvement Suggestions
                          </h5>
                          <ul className="space-y-2">
                            {feedback.suggestions.map((suggestion: string, index: number) => (
                              <li key={index} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-gray-700 leading-relaxed">{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {project.status === 'rejected' && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <RotateCcw className="h-4 w-4 text-rose-600" />
                            <p className="text-sm text-rose-800 font-semibold">
                              Ready to improve your project?
                            </p>
                          </div>
                          <p className="text-xs text-rose-700 leading-relaxed">
                            Use the feedback above to enhance your project. Click "Edit" to make improvements,
                            or use the reset button to re-evaluate without changes.
                          </p>
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