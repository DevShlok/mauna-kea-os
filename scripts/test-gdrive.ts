async function testDownload() {
  const fileId = "1qspME44psshRrqxumDxCvreq6wCDyBNJ";
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  console.log("Fetching from:", url);
  const res = await fetch(url);
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers.get("content-type"));
  
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log("Size:", buffer.length);
  
  if (res.headers.get("content-type")?.includes("text/html")) {
    console.log("Got HTML instead of file. Printing snippet:");
    console.log(buffer.toString("utf8").substring(0, 500));
  } else {
    console.log("Successfully downloaded binary file!");
  }
}

testDownload();
