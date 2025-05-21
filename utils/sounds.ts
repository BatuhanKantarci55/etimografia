// utils/sounds.ts
import { Howl } from 'howler';

const correctSound = new Howl({
    src: ['/sounds/correct.mp3'],
});

export const playCorrectSound = () => {
    correctSound.play();
};

const wrongSound = new Howl({
    src: ['/sounds/wrong.mp3'],
});

export const playWrongSound = () => {
    wrongSound.play();
};

const comboSound = new Howl({
    src: ['/sounds/combo.mp3'],
});

export const playComboSound = () => {
    comboSound.play();
};

const fireworksSound = new Howl({
    src: ['/sounds/fireworks.mp3'],
});

export const playFireworksSound = () => {
    fireworksSound.play();
};
