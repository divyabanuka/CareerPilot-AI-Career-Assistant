import gradio as gr
import requests

languages = {
    "English": "en",
    "Hindi": "hi",
    "Telugu": "te",
    "Tamil": "ta",
    "Kannada": "kn",
    "Malayalam": "ml",
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Japanese": "ja",
    "Chinese": "zh-CN",
    "Arabic": "ar"
}

def translate_text(text, source, target):
    if not text.strip():
        return "Please enter some text."

    if source == target:
        return text

    try:
        url = "https://api.mymemory.translated.net/get"

        params = {
            "q": text,
            "langpair": f"{languages[source]}|{languages[target]}"
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()
        return data["responseData"]["translatedText"]

    except Exception as e:
        return f"Translation failed: {e}"

with gr.Blocks(title="CodeAlpha Language Translation Tool") as app:

    gr.Markdown("# 🌍 CodeAlpha Language Translation Tool")
    gr.Markdown("Translate text easily between multiple languages.")

    text = gr.Textbox(
        label="Enter Text",
        placeholder="Type your text here..."
    )

    source = gr.Dropdown(
        choices=list(languages.keys()),
        value="English",
        label="Source Language"
    )

    target = gr.Dropdown(
        choices=list(languages.keys()),
        value="Hindi",
        label="Target Language"
    )

    translate_button = gr.Button("🔄 Translate")

    result = gr.Textbox(
        label="Translated Result",
        interactive=False
    )

    translate_button.click(
        fn=translate_text,
        inputs=[text, source, target],
        outputs=result
    )

app.launch()