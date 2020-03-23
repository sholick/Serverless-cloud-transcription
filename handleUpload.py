import json
import boto3
import json
import time

def debug(body):
    return {
            'statusCode': 200,
            "headers": { 
            "Access-Control-Allow-Origin": "*" 
            },
            'body': json.dumps(body)
        }

def lambda_handler(event, context):
    
    s3 = boto3.client('s3')

    body = event['body']
    splitted = body.split('=')
    if len(splitted) == 2:
        key = splitted[1]
    
    bucket = 'audio-files-ffmpeg'
    try:
        fnameSplit = key.split(".")
        key =  str(int(time.time())) + '.' + fnameSplit[-1]
        key = "input/" + key
    except:
        return debug(body)
    
    conditions = [
        ["content-length-range", 10, 10485760]
    ]
    
    result = s3.generate_presigned_post(Bucket = bucket, Key = key, Conditions = conditions)
    
    return {
        'statusCode': 200,
        "headers": { 
            "Access-Control-Allow-Origin": "*" 
        },
        'body': json.dumps(result),
    }