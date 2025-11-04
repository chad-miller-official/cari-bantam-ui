const fse = require('fs-extra');
const path = require('path');

const nodeModulesDir = path.join(__dirname, 'node_modules');
const publicDir = path.join(__dirname, 'build', 'ext');

fse.emptyDirSync(path.join(publicDir, 'tinymce'));
fse.emptyDirSync(path.join(publicDir, 'tinymce-webcomponent'));
fse.copySync(path.join(nodeModulesDir, 'tinymce'), path.join(publicDir, 'tinymce'), { overwrite: true });
fse.copySync(path.join(nodeModulesDir, '@tinymce', 'tinymce-webcomponent', 'dist'), path.join(publicDir, 'tinymce-webcomponent'), { overwrite: true });