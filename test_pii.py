import json
from pii_detection2 import PIIDetectionAgent


agent = PIIDetectionAgent()

image_to_analyze = "input_image2.jpg" 


try:
    results = agent.analyze_image(image_to_analyze)

    print("\n--- ANALYSIS REPORT ---")
    print(json.dumps(results, indent=2))
    
    output_file = "pii_analysis_report.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n✓ Full report saved to: {output_file}")

except FileNotFoundError:
    print(f"Error: The file '{image_to_analyze}' was not found.")
except Exception as e:
    print(f"An error occurred during analysis: {e}")