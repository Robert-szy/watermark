const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');
const os_tmpdir = require('os-tmpdir');


const addImageTransform = async function(inputFile, transformation) {
    try {
        const image = await Jimp.read(inputFile);
        switch (transformation) {
            case 'none':
                return;
            case 'make image brighter':
                image.brightness( 0.2 );
                await image.quality(100).writeAsync(inputFile);
                return;
            case 'increase contrast':
                image.contrast( 0.2 );
                await image.quality(100).writeAsync(inputFile);
                return;
            case 'make image b&w':
                image.greyscale();
                await image.quality(100).writeAsync(inputFile);
                return;
            case 'invert image':
                image.invert();
                await image.quality(100).writeAsync(inputFile);
                return;
            default:
                console.log('Something went wrong... Try again!');
        }
    }
    catch (error) {
        console.log('Something went wrong... Try again!');
    }
}
const addTextWatermarkToImage = async function(inputFile, outputFile, text, addEdit) {
    try {
        const image = await Jimp.read(inputFile);
        const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
        image.print(
            font, 
            0, 
            0, 
            {
                text: text,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
            },
            image.getWidth(), 
            image.getHeight()
            );
            await image.quality(100).writeAsync(outputFile);
            addImageTransform (outputFile, addEdit);

            console.log('Success! File ', outputFile, ' created.');
            
            const answer = await inquirer.prompt([{
                name: 'again',
                message: 'Run again?',
                type: 'confirm'
            }]);
            if(!answer.again) process.exit();
            startApp();
    }
    catch (error){
        console.log('Something went wrong... Try again!');
    } 
};

const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile, addEdit) {
    try {
        const image = await Jimp.read(inputFile);
        const watermark = await Jimp.read(watermarkFile);
        const x = image.getWidth() / 2 - watermark.getWidth() / 2;
        const y = image.getHeight() / 2 - watermark.getHeight() / 2;
        
        image.composite(watermark, x, y, {
            mode: Jimp.BLEND_SOURCE_OVER,
            opacitySource: 0.5,
        });
        await image.quality(100).writeAsync(outputFile);
        addImageTransform (outputFile, addEdit);

        console.log('Success! File ', outputFile, ' created.');

            const answer = await inquirer.prompt([{
                name: 'again',
                message: 'Run again?',
                type: 'confirm'
            }]);
            if(!answer.again) process.exit();
            startApp();
    }
    catch (error){
        console.log('Something went wrong... Try again!');
    }
};
  
const prepareOutputFilename = function(sourceName) {
    const nameArr = sourceName.split('.');
    const targetName = nameArr[0] + '-with-watermark.' + nameArr[1];
    return targetName;
}

const startApp = async () => {

    // Ask if user is ready
    const answer = await inquirer.prompt([{
        name: 'start',
        message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
        type: 'confirm'
      }]);
  
    // if answer is no, just quit the app
    if(!answer.start) process.exit();
  
    // ask about input file and watermark type
    const options = await inquirer.prompt([{
      name: 'inputImage',
      type: 'input',
      message: 'What file do you want to mark?',
      default: 'test.jpg',
    }, {
      name: 'watermarkType',
      type: 'list',
      choices: ['Text watermark', 'Image watermark'],
    }, {
        name: 'addEdit',
        message: 'Additional changes?',
        type: 'list',
        choices: [
            'none',
            'make image brighter', 
            'increase contrast',
            'make image b&w',
            'invert image'
            ],
        default: 'none',
    }]);
   
    if (fs.existsSync('./img/' + options.inputImage)) {
    
        if(options.watermarkType === 'Text watermark') {
            const text = await inquirer.prompt([{
            name: 'value',
            type: 'input',
            message: 'Type your watermark text:',
            }]);
            options.watermarkText = text.value;
            addTextWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), options.watermarkText, options.addEdit);
        } else {
            const image = await inquirer.prompt([{
            name: 'filename',
            type: 'input',
            message: 'Type your watermark name:',
            default: 'logo.png',
            }]);
            options.watermarkImage = image.filename;
            if (fs.existsSync('./img/' + options.watermarkImage)) {
                addImageWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), './img/' + options.watermarkImage, options.addEdit);
            } else {
                console.log ('Something went wrong... No watermark file. Try again');
                return;
            } 
        }
    } else {
        console.log ('Something went wrong... No input file. Try again');
        return;
    }
}
  
startApp();

