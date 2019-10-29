window.onload = function () {
    var btn = document.getElementById('green-button');

    var canvas = document.getElementById('canvas');
    btn.addEventListener('click', function () {

        var edits = ['../public/stickers/beard-no-background-18.png',
            '../public/stickers/beard-transparent-background-photoshop-psd_112283.png',
            '../public/stickers/download.jpeg',
            '../public/stickers/hipster-clipart-transparent-17.png',
            '../public/stickers/men-hair-pngs-for-images-27.png',
            '../public/stickers/woman-hair-png-2.png'];
        img_src = edits[(Math.random() * edits.length) | 0]

        var newImg = document.createElement('img');
        newImg.src = img_src;
        newImg.width = '50';
        newImg.height = '50';

        document.getElementById('canvas').appendChild(newImg);
        var ctx = canvas.getContext("2d");
        ctx.drawImage(newImg, 0, 0, 400, 300);
    });
}