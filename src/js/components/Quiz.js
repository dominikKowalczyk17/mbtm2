/**
 * Quiz - klasa do obslugi uproszczonych quizow (na potrzeby love island)
 * @author Piotr Chrobak
 */

import Events from '../utils/Events';
import { delegate, delay } from '../utils/helpers';
import { localStore } from '../utils/StorageFactory';

const storage = localStore;

class Quiz {
  constructor(el) {

    this.quiz = el;
    this.quizId = this.quiz.dataset.id;
    this.quizUpdate = this.quiz.dataset.update;

    this.stepsState = Array.from(this.quiz.querySelectorAll('.quiz__state'));
    this.endStep = this.quiz.querySelector('.quiz__state--end');

    this.state = this.getState(this.quizId);
    if (this.state.end) {
      this.showResult();
      return;
    }

    // init
    Events.on(this.endStep, 'change', this.showResult);
    Events.on(this.quiz, 'click', delegate('.quiz__button', this.answer));

    const step = this.state.update === this.quizUpdate
              && this.state.step ? this.state.step : 0;

    if (step > 0) {
      this.setStep(step);
    } else {
      const startButton = this.quiz.querySelector('.quiz__start');
      startButton.disabled = false;

      Events.on(startButton, 'click', () => {
        const step = 1;

        this.setStep(step);
        this.state.set({
          step,
          update: this.quizUpdate,
          answers: [],
        });
      });
    }
  }

  getStoredState() {
    const state = {};

    try {
      Object.assign(state, JSON.parse(storage.getItem('quiz')));
    } catch (e) {}

    return state;
  }

  getState(id) {
    const storedState = this.getStoredState();
    const state = storedState[id] || {};

    return Object.assign(state, {
      set: function(newState) {
        Object.assign(state, newState);
        this.save();
      },
      save: function() {
        Object.assign(storedState, { [id]: this });
        storage.setItem('quiz', JSON.stringify(storedState));
      }
    });
  }

  setStep(val) {
    this.stepsState.forEach((step, i) => {
      step.checked = val === i;

      if (step.checked && step === this.endStep) {
        Events.emit(step, 'change');
      }
    });
  }

  answer = event => {
    event.preventDefault();

    if (this.pending) {
      return;
    }

    const { delegateTarget } = event;
    const answersEl = delegateTarget.closest('.quiz__answers');

    Array.from(answersEl.querySelectorAll('.quiz__button')).forEach(button => {
      button.classList.remove('is--active');
    });

    delegateTarget.classList.add('is--active');

    clearTimeout(this.timer);
    this.timer = setTimeout(() => {

      this.pending = true;

      const valid = delegateTarget.dataset.valid == 1;

      const id = answersEl.dataset.id;

      if (valid) {
        delegateTarget.classList.add('is--valid');
      } else {
        delegateTarget.classList.add('is--invalid');

        const buttons = Array.from(answersEl.querySelectorAll('.quiz__button'));
        buttons.some(button => {
          if (button.dataset.valid == 1) {
            button.classList.add('is--valid');
            return true;
          }
        });
      }

      const step = this.state.step + 1;
      const answers = this.state.answers || [];
      answers.push({
        id,
        valid
      });

      this.state.set({ step, answers });

      Promise.resolve()
        .then(delay(2000))
        .then(() => {
          this.setStep(step);

          this.pending = false;
        });

    }, 1000);
  }

  showResult = () => {
    this.endStep.checked = 1;

    const countValid = this.state.answers.reduce((count, answer) => {
      return count + !!answer.valid;
    }, 0);

    this.quiz.querySelector('.quiz__result-valid').textContent = countValid;

    if (countValid / this.state.answers.length <= 0.25) {
      this.quiz.querySelector('.quiz__result-text').textContent = 'Buu... słabiutko.';
    }
    else if (countValid / this.state.answers.length <= 0.5) {
      this.quiz.querySelector('.quiz__result-text').textContent = 'Hm... mogło być lepiej.';
    }
    else if (countValid / this.state.answers.length <= 0.75) {
      this.quiz.querySelector('.quiz__result-text').textContent = 'Całkiem nieźle.';
    }
    else {
      this.quiz.querySelector('.quiz__result-text').textContent = 'Gratulacje, świetnie ci poszło.';
      this.quiz.querySelector('.feed__text--1').style.display='none';
      this.quiz.querySelector('.feed__text--2').style.display='block';
      this.quiz.querySelector('.feed__text').style.display='none';
    }

    const shareButton = this.quiz.querySelector('.quiz__share');
    if (shareButton) {
      shareButton.setAttribute('data-share', JSON.stringify({
        type: 'quiz',
        valid: countValid,
        all: this.state.answers.length,
      }));
    }

    this.state.set({ end: true });
  }
}

export default Quiz;
