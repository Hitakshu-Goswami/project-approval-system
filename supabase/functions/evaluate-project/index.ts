import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Fallback evaluation function
function performFallbackEvaluation(project: any) {
  const title = project.title?.trim() || '';
  const description = project.description?.trim() || '';

  let score = 0;
  const suggestions = [];

  // Title evaluation
  if (title.length >= 5) {
    score += 25;
  } else {
    suggestions.push("Provide a more descriptive title (at least 5 characters)");
  }

  // Description length evaluation
  if (description.length >= 50) {
    score += 25;
  } else {
    suggestions.push("Provide a more detailed description (at least 50 characters)");
  }

  // Detailed description evaluation
  if (description.length >= 100) {
    score += 25;
  } else {
    suggestions.push("Add more details about your project goals and implementation");
  }

  // Goal/objective evaluation
  const hasGoals = description.toLowerCase().includes('goal') ||
                   description.toLowerCase().includes('objective') ||
                   description.toLowerCase().includes('purpose') ||
                   description.toLowerCase().includes('aim');

  if (hasGoals) {
    score += 25;
  } else {
    suggestions.push("Clearly state your project's goals and objectives");
  }

  const recommendation = score >= 75 ? 'APPROVE' : score >= 50 ? 'PENDING' : 'REJECT';

  let feedback = '';
  if (recommendation === 'APPROVE') {
    feedback = 'Your project meets the basic criteria and has been approved. Good job on providing clear details!';
  } else if (recommendation === 'PENDING') {
    feedback = 'Your project shows promise but needs some improvements before approval.';
  } else {
    feedback = 'Your project needs significant improvements before it can be approved.';
  }

  return {
    recommendation,
    feedback,
    suggestions
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Project ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let evaluationResult;

    // Check if Gemini API key is available
    if (!geminiApiKey) {
      console.log('Gemini API key not available, using fallback evaluation');
      evaluationResult = performFallbackEvaluation(project);
    } else {
      try {
        console.log('Using Gemini AI for evaluation');
        // Prepare prompt for Gemini
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

        // Call Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
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
          console.error('Gemini API error:', await response.text());
          throw new Error('Gemini API failed');
        }

        const geminiData = await response.json();
        const aiResponse = geminiData.candidates[0].content.parts[0].text;

        try {
          // Extract JSON from the response (it might be wrapped in ```json```)
          const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || aiResponse.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
          evaluationResult = JSON.parse(jsonString);
          console.log('Successfully parsed AI evaluation:', evaluationResult);
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          // Fallback if AI doesn't return valid JSON
          evaluationResult = {
            recommendation: 'PENDING',
            feedback: aiResponse,
            suggestions: []
          };
        }
      } catch (geminiError) {
        console.error('Gemini evaluation failed, using fallback:', geminiError);
        evaluationResult = performFallbackEvaluation(project);
      }
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
      return new Response(JSON.stringify({ error: 'Failed to update project' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Project ${projectId} evaluated: ${newStatus}`);

    return new Response(JSON.stringify({
      success: true,
      evaluation: evaluationResult,
      newStatus,
      usedFallback: !geminiApiKey
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in evaluate-project function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});