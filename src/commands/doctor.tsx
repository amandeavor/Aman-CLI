import React, { useEffect, useState } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import { doctorService } from '../services/doctor.service.js';
import { HealthReport } from '../ui/components/HealthReport.js';
import { HealthCheck } from '../types/index.js';
import { Narrator } from '../ui/components/Narrator.js';
import { theme } from '../ui/theme.js';
import { useResponsiveLayout, MIN_COLUMNS, MIN_ROWS } from '../ui/layout.js';

export const DoctorApp = ({ onBack }: { onBack?: () => void }) => {
  const { exit } = useApp();
  const [checks, setChecks] = useState<HealthCheck[] | null>(null);
  const { rows, columns, isTooSmall, isCompact, physicalColumns, physicalRows } = useResponsiveLayout();

  useEffect(() => {
    doctorService.runChecks('global').then((result) => {
      setChecks(result);
      if (!onBack) {
        setTimeout(() => exit(), 300);
      }
    });
  }, [exit, onBack]);

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      if (onBack) onBack();
      else exit();
    }
  });

  if (!checks) {
    return (
      <Box paddingX={1} flexDirection="column" height={rows} justifyContent="space-between">
        <Box flexDirection="column">
          <Narrator state="searching" compact />
          <Box marginLeft={1}>
            <Text>Running health checks...</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box paddingX={1} flexDirection="column" height={rows} justifyContent="space-between">
      <Box flexDirection="column">
        <Box marginBottom={1} flexDirection="column">
          <Text bold color={theme.accent}>Terminal</Text>
          <Text color={theme.borderMuted}>────────</Text>
          <Text>Size: {physicalColumns}×{physicalRows}</Text>
          <Text>Mode: {isCompact ? 'Compact' : 'Normal'}</Text>
          {isTooSmall ? (
             <Text color={theme.error}>✗ Below minimum supported size ({MIN_COLUMNS}x{MIN_ROWS})</Text>
          ) : (
             <Text color={theme.success}>✓ Supported</Text>
          )}
        </Box>
        <HealthReport checks={checks} />
      </Box>
      {onBack && (
        <Box marginTop={1}>
          <Text color={theme.dim}>Press esc or q to go back</Text>
        </Box>
      )}
    </Box>
  );
};

export async function doctorCommand(options: { project?: boolean; json?: boolean } = {}) {
  const scope = options.project ? 'project' : 'global';
  const checks = await doctorService.runChecks(scope);
  const summary = {
    passed: checks.filter(check => check.status === 'pass').length,
    warnings: checks.filter(check => check.status === 'warn').length,
    failed: checks.filter(check => check.status === 'fail').length,
  };
  if (options.json) {
    console.log(JSON.stringify({ scope, summary, checks }, null, 2));
  } else {
    console.log(`\nAman CLI · ${scope} environment\nRead-only diagnostics\n`);
    for (const check of checks) {
      console.log(`[${check.status.toUpperCase()}] ${check.name}: ${check.message}`);
      if (check.fix) console.log(`  Next: ${check.fix}`);
    }
    console.log(`\n${summary.passed} passed · ${summary.warnings} warnings · ${summary.failed} failed`);
  }
  process.exitCode = summary.failed > 0 ? 1 : 0;
}
