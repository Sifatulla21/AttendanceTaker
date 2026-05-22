'use server';
/**
 * @fileOverview A Genkit flow for generating a natural language summary of a student's attendance behavior.
 *
 * - studentAttendanceSummary - A function that initiates the AI summarization process.
 * - StudentAttendanceSummaryInput - The input type for the studentAttendanceSummary function.
 * - StudentAttendanceSummaryOutput - The return type for the studentAttendanceSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudentAttendanceRecordSchema = z.object({
  date: z.string().describe('The date of the attendance record in YYYY-MM-DD format.'),
  status: z.enum(['Present', 'Absent']).describe('The attendance status for the day.'),
});

const StudentAttendanceSummaryInputSchema = z.object({
  studentName: z.string().describe('The name of the student for whom to summarize attendance.'),
  attendanceRecords: z.array(StudentAttendanceRecordSchema).describe('A list of attendance records for the student over a period.'),
  startDate: z.string().describe('The start date of the period for summarization in YYYY-MM-DD format.'),
  endDate: z.string().describe('The end date of the period for summarization in YYYY-MM-DD format.'),
});
export type StudentAttendanceSummaryInput = z.infer<typeof StudentAttendanceSummaryInputSchema>;

const StudentAttendanceSummaryOutputSchema = z.string().describe('A natural language summary of the student\'s attendance behavior.');
export type StudentAttendanceSummaryOutput = z.infer<typeof StudentAttendanceSummaryOutputSchema>;

const studentAttendanceSummaryPrompt = ai.definePrompt({
  name: 'studentAttendanceSummaryPrompt',
  input: { schema: StudentAttendanceSummaryInputSchema },
  output: { schema: StudentAttendanceSummaryOutputSchema },
  prompt: `You are an AI assistant tasked with analyzing a student's attendance behavior and providing a concise, natural language summary.
The goal is to quickly understand engagement patterns and identify potential issues for the student.

Analyze the following attendance records for "{{studentName}}" from {{startDate}} to {{endDate}}.
Focus on identifying overall attendance rate, streaks of presence/absence, days of the week with more frequent absences, and any other notable patterns.

Attendance Records:
{{#each attendanceRecords}}
- Date: {{this.date}}, Status: {{this.status}}
{{/each}}

Provide a summary that includes:
1. Overall attendance percentage.
2. Observations on consistency (e.g., mostly present, frequent absences, improving/declining trend).
3. Any specific days of the week that show a pattern of absence.
4. Potential issues or areas of concern based on the patterns.

Format your response as a single, clear natural language paragraph or a few bullet points, suitable for a teacher.`,
});

const studentAttendanceSummaryFlow = ai.defineFlow(
  {
    name: 'studentAttendanceSummaryFlow',
    inputSchema: StudentAttendanceSummaryInputSchema,
    outputSchema: StudentAttendanceSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await studentAttendanceSummaryPrompt(input);
    if (!output?.text) {
        throw new Error('Failed to generate attendance summary.');
    }
    return output.text;
  }
);

export async function studentAttendanceSummary(input: StudentAttendanceSummaryInput): Promise<StudentAttendanceSummaryOutput> {
  return studentAttendanceSummaryFlow(input);
}
