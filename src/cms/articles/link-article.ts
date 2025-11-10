import {ArticlePreview} from "../../articles/components/article-preview";
import {setup, toggleButton} from "./form-common";

$(() => setup(() => toggleButton($('#publishTools > button[type=submit]'))))

export {ArticlePreview}