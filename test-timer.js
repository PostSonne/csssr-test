// Slomux — упрощённая, сломанная реализация Flux.
// Перед вами небольшое приложение, написанное на React + Slomux.
// Это нерабочий секундомер с настройкой интервала обновления.

// Исправьте ошибки и потенциально проблемный код, почините приложение и прокомментируйте своё решение.

// При нажатии на "старт" должен запускаться секундомер и через заданный интервал времени увеличивать свое значение на значение интервала
// При нажатии на "стоп" секундомер должен останавливаться и сбрасывать свое значение

const createStore = (reducer, initialState) => {
  let currentState = initialState
  const listeners = []

  const getState = () => currentState
  const dispatch = action => {
    currentState = reducer(currentState, action)
    listeners.forEach(listener => listener())
  }

  const subscribe = listener => listeners.push(listener)

  return { getState, dispatch, subscribe }
}

const connect = (mapStateToProps, mapDispatchToProps) =>
  Component => {
    class WrappedComponent extends React.Component {
      render() {
        return (
          <Component
            {...this.props}
            {...mapStateToProps(this.context.store.getState(), this.props)}
            {...mapDispatchToProps(this.context.store.dispatch, this.props)}
          />
        )
      }
      
      // Меняем componentDidUpdate на componentDidMount, т.к. в жизненном цикле компонента этот метод подходит для настройки подписок
      componentDidMount() {
        this.context.store.subscribe(this.handleChange)
      }

      handleChange = () => {
        this.forceUpdate()
      }
    }

    WrappedComponent.contextTypes = {
      store: PropTypes.object,
    }

    return WrappedComponent
  }

class Provider extends React.Component {
  getChildContext() {
    return {
      store: this.props.store,
    }
  }
  
  render() {
    return React.Children.only(this.props.children)
  }
}

Provider.childContextTypes = {
  store: PropTypes.object,
}

// APP

// actions
const CHANGE_INTERVAL = 'CHANGE_INTERVAL'

// action creators
const changeInterval = value => ({
  type: CHANGE_INTERVAL,
  payload: value,
})


// reducers
const reducer = (state, action) => {
  switch(action.type) {
    case CHANGE_INTERVAL:
    // Проверка значения интервала: интервал всегда строго положительное число
    return action.payload + state > 0 ?
           state += action.payload : 
           state;
    // Возвращаем дефолтное значение
    default:
      return state;
  }
}

// components

class IntervalComponent extends React.Component {
  render() {
    // Добавляем деструктуризацию
    const {currentInterval, changeInterval} = this.props;
    return (
      <div>
        <span>Интервал обновления секундомера: {currentInterval} сек.</span>
        <span>
          <button onClick={() => changeInterval(-1)}>-</button>
          <button onClick={() => changeInterval(1)}>+</button>
        </span>
      </div>
    )
  }
}

// Изменяем порядок параметров для функции connect(mapStateToProps, mapDispatchToProps)
const Interval = connect(
  state => ({
    currentInterval: state
  }),
  dispatch => ({
    changeInterval: value => dispatch(changeInterval(value))
  }))(IntervalComponent);

class TimerComponent extends React.Component {
  // Добавляем состояние активен ли таймер, чтобы дизейблить кнопки
  state = {
    currentTime: 0,
    isActive: false
  }
  
  // При анмаунте сбрасываем интервал
  componentWillUnmount() {
    clearInterval(this.timeout);
  }

  render() {
    const { currentTime, isActive } = this.state;
    return (
      <div>
        <Interval />
        <div>
          Секундомер: {currentTime} сек.
        </div>
        <div>
          <button onClick={this.handleStart} disabled={isActive}>Старт</button>
          <button onClick={this.handleStop} disabled={!isActive}>Стоп</button>
        </div>
      </div>
    )
  }

  // Переписываем метод как стрелочную функцию, используем значение this окружающего контекста
  // Используем метод setInterval для регулярного вызова функции
  handleStart = () => {
    this.timeout = setInterval(() => this.setState({
      currentTime: this.state.currentTime + this.props.currentInterval
    }), this.props.currentInterval * 1000);
    this.setState({ isActive: true});
  }
  
  // Переписываем метод как стрелочную функцию, используем значение this окружающего контекста
  handleStop = () => {
    clearTimeout(this.timeout);
    this.setState({ currentTime: 0, isActive: false })
  }
}

const Timer = connect(state => ({
  currentInterval: state,
}), () => {})(TimerComponent)

// init
// Добавляем вторым аргументом в функцию createStore() значение initialState = 0
ReactDOM.render(
  <Provider store={createStore(reducer, 0)}>
    <Timer />
  </Provider>,
  document.getElementById("app")
)
