import tkinter as tk
from tkinter import messagebox, scrolledtext
from openai import OpenAI
import os

# Initialize OpenAI client (make sure OPENAI_API_KEY is set in your system)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_ai_suggestion(scenario, options):
    """
    Sends the workplace scenario and options to ChatGPT and gets the best suggestion.
    """
    prompt = f"""
    You are an AI workplace trainer helping employees handle discrimination, unconscious bias, 
    and microaggressions with empathy and professionalism.

    Scenario: {scenario}

    Options:
    {chr(10).join([f"{i+1}. {opt}" for i, opt in enumerate(options)])}

    Question: Which option is the most inclusive and effective response, and why?
    Give your answer in this format:
    - Best Option: (number)
    - Reason: (short explanation)
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error: {str(e)}"

def run_gui():
    root = tk.Tk()
    root.title("AI Workplace Trainer")
    root.geometry("700x600")
    root.config(bg="#f0f4f7")

    # Scenario input
    tk.Label(root, text="Workplace Scenario:", font=("Arial", 12, "bold"), bg="#f0f4f7").pack(anchor="w", padx=10, pady=5)
    scenario_box = scrolledtext.ScrolledText(root, height=5, wrap=tk.WORD, font=("Arial", 11))
    scenario_box.pack(fill="x", padx=10, pady=5)

    # Options input
    tk.Label(root, text="Options (one per line):", font=("Arial", 12, "bold"), bg="#f0f4f7").pack(anchor="w", padx=10, pady=5)
    options_box = scrolledtext.ScrolledText(root, height=6, wrap=tk.WORD, font=("Arial", 11))
    options_box.pack(fill="x", padx=10, pady=5)

    # Output
    tk.Label(root, text="AI Suggestion:", font=("Arial", 12, "bold"), bg="#f0f4f7").pack(anchor="w", padx=10, pady=5)
    output_box = scrolledtext.ScrolledText(root, height=10, wrap=tk.WORD, font=("Arial", 11), fg="darkblue")
    output_box.pack(fill="both", padx=10, pady=5, expand=True)

    # Button action
    def analyze():
        scenario = scenario_box.get("1.0", tk.END).strip()
        options = options_box.get("1.0", tk.END).strip().split("\n")

        if not scenario or not options or options == [""]:
            messagebox.showwarning("Input Error", "Please enter a scenario and at least one option.")
            return

        output_box.delete("1.0", tk.END)
        output_box.insert(tk.END, "Analyzing... Please wait...\n")
        root.update()

        suggestion = get_ai_suggestion(scenario, options)
        output_box.delete("1.0", tk.END)
        output_box.insert(tk.END, suggestion)

    # Button
    tk.Button(root, text="Get AI Suggestion", font=("Arial", 12, "bold"),
              bg="#4CAF50", fg="white", command=analyze).pack(pady=10)

    root.mainloop()

if __name__ == "__main__":
    run_gui()
