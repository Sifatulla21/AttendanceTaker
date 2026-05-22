'use server';
/**
 * @fileOverview This file implements a Genkit flow for predicting at-risk students based on attendance data.
 *
 * - predictAtRiskStudents - A function that analyzes historical attendance patterns to identify students at risk of habitual absence.
 * - PredictAtRiskStudentsInput - The input type for the predictAtRiskStudents function.
 * - PredictAtRiskStudentsOutput - The return type for the predictAtRiskStudents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const AttendanceRecordSchema = z.object({
  date: z.string().describe('The date of the attendance record (YYYY-MM-DD).'),
  status: z.enum(['present', 'absent']).describe('The attendance status for the day.'),
});

const StudentAttendanceDataSchema = z.object({
  studentId: z.string().describe('Unique identifier for the student.'),
  rollNumber: z.number().describe('The student\'s roll number.'),
  attendanceHistory: z.array(AttendanceRecordSchema).describe('Historical attendance records for the student.'),
});

const PredictAtRiskStudentsInputSchema = z.object({
  students: z.array(StudentAttendanceDataSchema).describe('A list of students with their attendance history.'),
  recentThresholdDays: z.number().optional().default(30).describe('Number of recent days to focus on for identifying recent absence patterns.'),
});
export type PredictAtRiskStudentsInput = z.infer<typeof PredictAtRiskStudentsInputSchema>;

// Define the output schema
const AtRiskStudentSchema = z.object({
  studentId: z.string().describe('Unique identifier for the at-risk student.'),
  rollNumber: z.number().describe('The roll number of the at-risk student.'),
  riskReason: z.string().describe('A detailed explanation of why the student is considered at-risk, including identified patterns or contributing factors.'),
  recommendedIntervention: z.string().optional().describe('Optional recommendation for how to support the student or what action to take.'),
});

const PredictAtRiskStudentsOutputSchema = z.object({
  atRiskStudents: z.array(AtRiskStudentSchema).describe('A list of students identified as being at risk of habitual absence.'),
  overallSummary: z.string().optional().describe('An optional summary of overall attendance trends or general insights.'),
});
export type PredictAtRiskStudentsOutput = z.infer<typeof PredictAtRiskStudentsOutputSchema>;

// Export wrapper function
export async function predictAtRiskStudents(
  input: PredictAtRiskStudentsInput
): Promise<PredictAtRiskStudentsOutput> {
  return predictAtRiskStudentsFlow(input);
}

// Define the prompt
const predictAtRiskStudentsPrompt = ai.definePrompt({
  name: 'predictAtRiskStudentsPrompt',
  input: { schema: PredictAtRiskStudentsInputSchema },
  output: { schema: PredictAtRiskStudentsOutputSchema },
  prompt: `You are an AI assistant specialized in analyzing student attendance data to identify patterns and predict at-risk students.
Your goal is to help teachers proactively support students.

Analyze the provided historical attendance data for each student.
Identify students who show patterns of habitual absence or are at high risk of developing such patterns.
Consider recent absences, frequency, and any emerging trends.

Here is the attendance data:
{{#each students}}
--- Student Roll Number: {{{rollNumber}}} (ID: {{{studentId}}}) ---
Attendance History:
{{#each attendanceHistory}}
  Date: {{{date}}}, Status: {{{status}}}
{{/each}}
{{/each}}

Focus particularly on absence patterns within the last {{{recentThresholdDays}}} days, if available.

For each student identified as at-risk, provide a clear 'riskReason' explaining the basis for your assessment.
Additionally, you may provide an optional 'recommendedIntervention' if a specific type of support seems appropriate.
If there are no students identified as at-risk, return an empty array for 'atRiskStudents'.
Provide an 'overallSummary' of attendance trends if it is insightful.
`,
});

// Define the flow
const predictAtRiskStudentsFlow = ai.defineFlow(
  {
    name: 'predictAtRiskStudentsFlow',
    inputSchema: PredictAtRiskStudentsInputSchema,
    outputSchema: PredictAtRiskStudentsOutputSchema,
  },
  async (input) => {
    const { output } = await predictAtRiskStudentsPrompt(input);
    return output!;
  }
);
