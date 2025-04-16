const { bucket } = require('./firebase'); // Adjust path if needed

async function testUpload() {
    const fileName = 'test.txt';
    const file = bucket.file(fileName);
    const contents = Buffer.from('Hello, Firebase!');
    
    try {
        await file.save(contents, { metadata: { contentType: 'text/plain' } });
        console.log(`File ${fileName} uploaded successfully.`);
    } catch (error) {
        console.error('Error uploading file:', error);
    }
}

testUpload();
