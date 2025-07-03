// ABOUTME: System health monitoring component for debugging and user feedback
// ABOUTME: Shows AI service status, database connectivity, and error reporting

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AIService } from '@/services/aiService';

interface SystemStatus {
  database: 'healthy' | 'error' | 'checking';
  aiService: 'healthy' | 'error' | 'checking';
  edgeFunction: 'healthy' | 'error' | 'checking';
}

interface SystemHealthProps {
  onAIServiceFixed?: () => void;
}

export function SystemHealth({ onAIServiceFixed }: SystemHealthProps) {
  const [status, setStatus] = useState<SystemStatus>({
    database: 'checking',
    aiService: 'checking',
    edgeFunction: 'checking'
  });
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const checkSystemHealth = async () => {
    setChecking(true);
    setErrors([]);
    const newErrors: string[] = [];

    // Check database connectivity
    try {
      const { error } = await supabase.from('patients').select('count', { count: 'exact', head: true });
      if (error) throw error;
      setStatus(prev => ({ ...prev, database: 'healthy' }));
    } catch (error) {
      console.error('Database check failed:', error);
      setStatus(prev => ({ ...prev, database: 'error' }));
      newErrors.push(`Database: ${error.message}`);
    }

    // Check edge function
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { action: 'test' }
      });
      if (error) throw error;
      setStatus(prev => ({ ...prev, edgeFunction: 'healthy' }));
    } catch (error) {
      console.error('Edge function check failed:', error);
      setStatus(prev => ({ ...prev, edgeFunction: 'error' }));
      newErrors.push(`Edge Function: ${error.message}`);
    }

    // Check AI service
    try {
      const questions = await AIService.generateQuestions('test headache');
      if (questions && questions.length > 0) {
        setStatus(prev => ({ ...prev, aiService: 'healthy' }));
        onAIServiceFixed?.();
      } else {
        throw new Error('No questions generated');
      }
    } catch (error) {
      console.error('AI service check failed:', error);
      setStatus(prev => ({ ...prev, aiService: 'error' }));
      newErrors.push(`AI Service: ${error.message}`);
    }

    setErrors(newErrors);
    setLastChecked(new Date());
    setChecking(false);
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const getStatusIcon = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const hasErrors = Object.values(status).some(s => s === 'error');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Health Status</span>
          <Button
            variant="outline"
            size="sm"
            onClick={checkSystemHealth}
            disabled={checking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Service Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.database)}
              <span className="font-medium">Database</span>
            </div>
            {getStatusBadge(status.database)}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.edgeFunction)}
              <span className="font-medium">Edge Function</span>
            </div>
            {getStatusBadge(status.edgeFunction)}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.aiService)}
              <span className="font-medium">AI Service</span>
            </div>
            {getStatusBadge(status.aiService)}
          </div>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">System Issues Detected:</p>
                {errors.map((error, index) => (
                  <p key={index} className="text-sm">• {error}</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Overall Status */}
        {!hasErrors && !checking && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All systems operational. Clinical assessment features should work normally.
            </AlertDescription>
          </Alert>
        )}

        {/* Last Checked */}
        {lastChecked && (
          <p className="text-sm text-gray-500 text-center">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        )}

        {/* Recovery Instructions */}
        {hasErrors && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Troubleshooting Steps:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {status.aiService === 'error' && (
                <li>• Check OpenRouter API key configuration in Supabase secrets</li>
              )}
              {status.edgeFunction === 'error' && (
                <li>• Verify edge function deployment status</li>
              )}
              {status.database === 'error' && (
                <li>• Check database connectivity and permissions</li>
              )}
              <li>• Try refreshing the page</li>
              <li>• Contact support if issues persist</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}