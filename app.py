import streamlit as st

st.set_page_config(page_title="Multimodal Math Mentor", layout="wide")

st.title("🧠 Multimodal Math Mentor")

mode = st.radio("Choose input type:", ["Text", "Image", "Audio"])

if mode == "Text":
    question = st.text_area("Enter your math problem:")
elif mode == "Image":
    st.file_uploader("Upload an image (JPG/PNG)")
elif mode == "Audio":
    st.file_uploader("Upload audio")

st.info("Agent execution, RAG retrieval, HITL, and memory integration coming next.")
