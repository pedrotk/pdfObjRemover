const { PDFDocument  , PDFName, PDFDict} = require('pdf-lib');
const fs = require('fs');

run().catch(err => console.log(err));

const createEmptyXObject = (pdfDoc) =>
    pdfDoc.context.stream(new Uint8Array(0), {
        Type: 'XObject',
        Subtype: 'Form',
        BBox: [0, 0, 0, 0],
    });

async function run() {
    if(!fs.existsSync('./volumes')){
        fs.mkdirSync('volumes')
    }
    if(!fs.existsSync('./result')){
        fs.mkdirSync('result')
    }

    const volumes = fs.readdirSync('./volumes')

    if(volumes.length === 0)
        throw 'Nenhum arquivo encontrado. Adicione os arquivos PDF\'s na pasta volumes'

    if(volumes.filter(str => str.match(/\.pdf$/g) !== null).length === 0)
        throw 'Nenhum arquivo PDF encontrado na pasta volumes'

    for(const volume of volumes){
        const doc = await PDFDocument.load(fs.readFileSync(`./volumes/${volume}`));
        const pages = doc.getPages()
        for(const page of pages){
            const resources = page.node.Resources().lookup(PDFName.of('XObject'), PDFDict)
            for(const [index] of resources.dict.entries()){
                if(index.encodedName === '/Fm0'){
                    const imageRef = resources.get(index)
                    doc.context.delete(imageRef)
                    const emptyXObject = createEmptyXObject(doc);
                    doc.context.assign(imageRef, emptyXObject);
                }
            }
        }

        const pdfDoc2Bytes =  await doc.save()
        fs.writeFileSync(`./result/${volume}`, await pdfDoc2Bytes);
        console.log(`finished: ${volume}`)
    }
}