import { BuildingData } from '../types/graph';
import { GraphValidator } from '../engine/graph/GraphValidator';
import { ValidationResult } from '../types/results';

export interface SerializationOutcome {
  success: boolean;
  data?: BuildingData;
  validation?: ValidationResult;
  error?: string;
}

export class SerializationUtil {
  public static exportToJson(building: BuildingData): string {
    return JSON.stringify(building, null, 2);
  }

  public static importFromJson(jsonString: string): SerializationOutcome {
    try {
      const parsed = JSON.parse(jsonString) as BuildingData;

      if (!parsed.metadata || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        return {
          success: false,
          error: 'Invalid building JSON structure: missing metadata, nodes, or edges array.',
        };
      }

      const validation = GraphValidator.validate(parsed);
      if (!validation.isValid) {
        return {
          success: false,
          data: parsed,
          validation,
          error: `Building validation failed with ${validation.issues.length} issue(s).`,
        };
      }

      return {
        success: true,
        data: parsed,
        validation,
      };
    } catch (e) {
      return {
        success: false,
        error: `JSON parse error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  public static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
