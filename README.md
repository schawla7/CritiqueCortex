# CritiqueCortex Chrome Extension

Start by cloning this git repository and following the pre-requisite steps. 

## Pre-requisites

1. Run this command : ```pip install requirements.txt```
2. Install Ollama : https://ollama.com/download
3. Pull a model Locally : ```ollama pull qwen2:7b``` 
4. Start Ollama in the background (In one terminal)
```ollama serve```

The above steps will provide you with LLM running locally which we have used in our configuration. Refer to LiteLLM to replace the above LLM with something of your choice in ```config.py```


## Start the Flask server

1. ```cd backend```
2. ```python app.py``` : This will start the flask app and will help you make requests

Note : make sure to have a python env and install the requirements.txt and then run the server so that we have all packages installed

## Test the chrome Extension

1. In Chrome go to `chrome://extensions`  
2. Toggle **Developer mode** on  
3. Click **Load unpacked** and select the **extension** folder  

## How it works

- Automatically activates on Amazon & Walmart product pages  
- Injects a floating panel and scrapes:
  - **Product info** (title, ID/ASIN)
  - **All visible reviews**  
- Logs everything to the console for now  
- Ready for you to plug in your summarizer or send data to your backend  

## Next steps

- Flesh out the `EbayAdapter` & `BestbuyAdapter`  
- Style the panel & add interactive querying UI  
