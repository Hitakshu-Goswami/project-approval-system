import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
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
      return new Response(JSON.stringify({ error: 'AI evaluation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await response.json();
    const aiResponse = geminiData.candidates[0].content.parts[0].text;

    let evaluationResult;
    try {
      evaluationResult = JSON.parse(aiResponse);
    } catch (parseError) {
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
      return new Response(JSON.stringify({ error: 'Failed to update project' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Project ${projectId} evaluated: ${newStatus}`);

    return new Response(JSON.stringify({ 
      success: true, 
      evaluation: evaluationResult,
      newStatus 
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