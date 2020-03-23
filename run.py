import subprocess
import boto3
import urllib
import time
import json

from google.cloud import speech_v1p1beta1
from google.cloud.speech_v1p1beta1 import enums

s3 = boto3.client('s3')

def sample_recognize(local_file_path):

    client = speech_v1p1beta1.SpeechClient()

    global language_code, sample_rate_hertz

    #encoding = enums.RecognitionConfig.AudioEncoding.LINEAR16
    config = {
        "language_code": "en-US",
        "sample_rate_hertz": 44100,
        "audio_channel_count": 2,
    }
    with open(local_file_path, "rb") as f:
        content = f.read()

    audio = {"content": content}

    _returnlist = []
    response = client.recognize(config, audio)
    for result in response.results:
        alternative = result.alternatives[0]
        _returnlist.append(alternative.transcript)
    return _returnlist

def dump_error(bucket, body):
	timeNow = str(int(time.time())) + ".txt"
	dumpBytes = json.dumps(body).encode("utf-8")
	s3.put_object(Bucket=bucket, Key="error/" + timeNow, Body=dumpBytes)

def lambda_handler(event, context):
    
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']

    ext = key.split('.')[-1]
    
    try:
        data = s3.get_object(Bucket=bucket, Key=key)
        SoleName = key.split("/")[-1]
        with open('/tmp/' + SoleName, 'wb') as output:
            output.write(data['Body'].read())

        command = ["./exodus/bin/ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", "/tmp/" + SoleName, "-ab", "160k", "-ac", "2", "-ar", "44100", "-vn", "/tmp/temp.wav"]
        
        outputBytes = subprocess.check_output(command).decode("utf-8")
        outstring = (" ").join(sample_recognize("/tmp/temp.wav"))
        savingbytes = outstring.encode("utf-8")
        s3.put_object(Bucket="transcript-generate-output", Key=".".join(SoleName.split(".")[:-1]) + ".html", Body=savingbytes, ContentType="text/html")

        return outputBytes + "\n" + outstring
        
    except Exception as e:
        dump_error(bucket, event['Records'][0])
        raise(e)
    
    return {
        'statusCode': 200,
        "headers": {
            'Content-Type': 'text/html',
        },
        'body': "success"
    }