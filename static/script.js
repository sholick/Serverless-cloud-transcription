
		(document.onload = function() {
			document.getElementById("file").value = "";

			function icon(status) {
				if (status == 'send')
					return '<i class = "fas fa-paper-plane" style="font-size:20px;"></i><span> start</span>'
				else if (status == 'upload')
					return '<i class="fas fa-sync-alt fa-spin" style="font-size:20px;"></i><span> uploading...</span>'
				else if (status == 'running')
					return '<i class="fas fa-hourglass-start" style="font-size:20px;"></i><span> working...</span>'
				else if (status == 'wrong')
					return '<i class="fas fa-times" style="font-size:20px;"></i><span> Something went wrong..</span>'
				else
					return '<a href="' + status + '" target="_blank"><i class="fas fa-check" style="font-size:20px;"></i><span> Download</span></a>'
				
			}

			var input = document.getElementById('file');

			input.addEventListener( 'change', function( e ) {
				var label	 = input.nextElementSibling,
					labelVal = label.innerHTML;
				var fileName = '';
				if( this.files && this.files.length > 1 )
					fileName = ( this.getAttribute( 'data-multiple-caption' ) || '' ).replace( '{count}', this.files.length );
				else
					fileName = e.target.value.split( '\\' ).pop();

				if( fileName )
					label.querySelector( 'span' ).innerHTML = fileName;
				else
					label.innerHTML = labelVal;
			});
			function waitASecond() {
			  return new Promise(resolve => {
			    setTimeout(() => {
			      resolve('resolved');
			    }, 1000);
			  });
			}
			async function pingFile(name, num){

				if (num >= 20){
					$("#submitlabel").html(icon('wrong'));
					return false;
				}
				bucket = "transcript-generate-output";
				fname = name + ".html"
				outlink = 'https://s3.amazonaws.com/' + bucket + '/' + fname;
				//var params = {Bucket: bucket, Key: fname};
				//console.log("pingfile invoked.")
				wait = await waitASecond();

				var client = new XMLHttpRequest();
				client.open("GET", outlink, true);
				client.onload = async function() {
				  if(this.readyState == this.DONE) {
				    if (this.status == 200) {
				    	$("#submitlabel").html(icon(outlink));
				    	console.log(this.response);
				    	console.log(this.responseText);
				    	$("#outputBox").html(this.response);
				    	$("#outputBox").show();
						return true;
				    }
				    else{
						const result = await pingFile(name, num + 1);
						client.abort();
						return result;
				    }
				  }
				}
				client.send();
			}


			document.querySelector("#myForm").addEventListener("submit", function(e){
				e.preventDefault();
				document.getElementById("submit").disabled = true;
				var fileContent = document.getElementById('file').files[0];
				if (!fileContent){
					alert('Please select file.');
					document.getElementById("submit").disabled = false;
					return;
				}
				else {
					ext = fileContent.name.split(".");
					ext = ext[ ext.length - 1 ];
					if ( ext != 'wav' && ext != 'mp3' && ext != 'mp4' && ext != 'mkv' && ext != "mov"){
						alert('We only accept certain formats:\nVideo (.mp4 .mov .mkv)\nAudio (.wav .mp3)');
						document.getElementById("submit").disabled = false;
						return;
					}
				}
				$("label#filelabel").addClass('expand');
				$("#file").disabled = true;
				$("#submitlabel").html(icon('upload'));
				var xhr = new XMLHttpRequest();
				xhr.open("POST", "https://4bzmr4smtj.execute-api.us-east-1.amazonaws.com/prod", true);
				xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xhr.onreadystatechange = function() {
				    if (xhr.readyState === XMLHttpRequest.DONE) {
				    	json_resp = JSON.parse(xhr.response);

						var form_Data = new FormData();
						form_Data.append("key", json_resp.fields.key);
						form_Data.append("AWSAccessKeyId", json_resp.fields.AWSAccessKeyId);
						form_Data.append("x-amz-security-token", json_resp.fields['x-amz-security-token']);
						form_Data.append("policy", json_resp.fields.policy);
						form_Data.append("signature", json_resp.fields.signature);
						form_Data.append("file", fileContent);

						var upload = new XMLHttpRequest();

						upload.open("POST", json_resp.url, true);
						upload.upload.addEventListener("progress", function(evt){
					      	if (evt.lengthComputable) {
					      		uploaded = parseInt(evt.loaded / evt.total * 100);
					        	gradient = "linear-gradient(90deg, rgba(0,212,255,1) " + uploaded + "%, rgba(9,9,121,1) " + (uploaded + 1) + "%, rgba(2,0,36,1) 100%)";
					        	$("#filelabel").css("background", gradient);
					      	}
					    }, false);
						upload.onreadystatechange = function() {
				    		if (upload.readyState === XMLHttpRequest.DONE) {
				    			$("#submitlabel").html(icon('running'));
				    			splitted = json_resp.fields.key.split('/');
				    			splitted = splitted[splitted.length - 1].split('.');
				    			splitted = splitted.slice(0, splitted.length - 1);
				    			rawFileName = splitted.join('.');
					    		pingFile(rawFileName, 0);
				    		}
				    	}
				    	setTimeout(upload.send(form_Data), 50);
				    	

					}
				}
				
				xhr.send("filename=" + fileContent.name);
			});
			
			

			
		})();