import os
import json

# Directory paths
BASE_DIR = 'data'
UNPROCESSED_DIR = os.path.join(BASE_DIR, 'unprocessed')
PROCESSED_DIR = os.path.join(BASE_DIR, 'processed')

# Ensure processed directory exists
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Row limit for processing
ROW_LIMIT = 10000


def process_file(input_file, output_file, row_limit=ROW_LIMIT):
    """
    Processes a single tab-separated file and converts it into JSON.
    """
    results = []
    with open(input_file, 'r', encoding='utf-8') as file:
        for i, line in enumerate(file):
            if i >= row_limit:
                break  # Stop processing after reaching the row limit

            # Split the line into fields by tabs
            fields = line.strip().split('\t')

            # Skip malformed lines
            if len(fields) < 5:
                print(f"Skipping malformed line {i + 1} in {input_file}")
                continue

            try:
                results.append({
                    "type": fields[0],
                    "key": fields[1],
                    "revision": fields[2],
                    "created": fields[3],
                    "metadata": json.loads(fields[4])  # Parse the JSON metadata
                })
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON on line {i + 1} in {input_file}: {e}")

    # Write the results to the output file
    with open(output_file, 'w', encoding='utf-8') as out_file:
        json.dump(results, out_file, indent=4, ensure_ascii=False)

    print(f"Processed {len(results)} rows from {input_file} to {output_file}.")


def process_all_files():
    """
    Processes all `.txt` files in the `unprocessed` directory.
    Outputs JSON files in the `processed` directory.
    """
    for file_name in os.listdir(UNPROCESSED_DIR):
        if file_name.endswith('.txt'):
            input_file_path = os.path.join(UNPROCESSED_DIR, file_name)
            output_file_name = f"output_{file_name.replace('.txt', '.json').split('_', 1)[1]}"
            output_file_path = os.path.join(PROCESSED_DIR, output_file_name)

            # Process the file
            process_file(input_file_path, output_file_path)


if __name__ == '__main__':
    process_all_files()
