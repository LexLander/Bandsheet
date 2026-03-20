export const locales = ['en', 'uk', 'ru'] as const

export type StaticLocale = (typeof locales)[number]
export type Locale = string

type TranslationTree = {
  app: {
    menu: string
    account: string
    main: string
    administration: string
    logout: string
    verifyDevice: string
    setlistsongAdmin: string
    nav: {
      overview: string
      groups: string
      library: string
      events: string
      profile: string
      settings: string
      users: string
      languages: string
      logs: string
      adminPanel: string
    }
    openMenu: string
    closeMenu: string
    close: string
  }
  lang: {
    label: string
    uk: string
    ru: string
    en: string
  }
  dashboard: {
    greeting: string
    myGroups: string
    library: string
    mySongs: string
    libraryPreparing: string
    events: string
    concerts: string
    profile: string
    settings: string
    upcomingEvents: string
    noEvents: string
    createGroup: string
    active: string
    groups: (n: number) => string
  }
  events: {
    back: string
    noSetlist: string
    setlist: string
    statusDraft: string
    statusActive: string
    statusArchived: string
    key: string
    noDate: string
    noVenue: string
  }
  library: {
    title: string
    searchPlaceholder: string
    searchButton: string
    searchResults: string
    noResults: string
    addToLibrary: string
    added: string
    adding: string
    remove: string
    removing: string
    addFailed: string
    removeFailed: string
    myLibrary: string
    empty: string
    emptyHint: string
    songKey: string
    songBpm: string
  }
  profile: {
    title: string
    subtitle: string
    email: string
    bio: string
    interfaceSettings: string
    theme: string
    themeSystem: string
    themeLight: string
    themeDark: string
    compactView: string
    showTimestamps: string
    save: string
    saving: string
    saved: string
    loading: string
  }
  groups: {
    title: string
    create: string
    noGroups: string
    createFirst: string
    back: string
    newTitle: string
    groupName: string
    groupNamePlaceholder: string
    creating: string
    createSubmit: string
    members: string
    membersCount: (n: number) => string
    unknownUser: string
    inviteTitle: string
    pendingTitle: string
    roles: {
      leader: string
      deputy: string
      switcher: string
      member: string
    }
    invite: {
      searchPlaceholder: string
      noName: string
      noUsersFound: string
      chooseUser: string
      sent: string
      sending: string
      send: string
      cancel: string
      cancelling: string
      cancelConfirm: string
    }
  }
  auth: {
    subtitle: string
    updatePasswordTitle: string
    newPassword: string
    confirmPassword: string
    savePassword: string
    savingPassword: string
    passwordTooShort: string
    passwordsDoNotMatch: string
    loginTitle: string
    passwordUpdated: string
    invalidLink: string
    accountBlocked: string
    passwordLabel: string
    forgotPassword: string
    loginSubmitting: string
    loginSubmit: string
    noAccount: string
    registerLink: string
    registerTitle: string
    nameLabel: string
    namePlaceholder: string
    passwordPlaceholder: string
    registerSubmitting: string
    registerSubmit: string
    registerDuplicateEmail: string
    hasAccount: string
    loginLink: string
    forgotTitle: string
    forgotDescription: string
    forgotSent: string
    forgotSubmitting: string
    forgotSubmit: string
    backToLogin: string
    checkEmailTitle: string
    checkEmailDescription: string
    checkEmailConfirmed: string
    resetTitle: string
    resetDescription: string
    resetPlaceholder: string
    resetConfirmLabel: string
    resetConfirmPlaceholder: string
    resetSubmitting: string
    resetSubmit: string
  }
  errors: {
    appLoadFailed: string
    appRetry: string
    authFailed: string
    authRetry: string
    adminFailed: string
    adminRefresh: string
  }
  admin: {
    layout: {
      panelTitle: string
      signedInAs: string
      defaultActorName: string
    }
    users: {
      tableUser: string
      tableRole: string
      tableStatus: string
      tableActions: string
      noName: string
      noEmail: string
      roleRootAdmin: string
      roleAdmin: string
      roleUser: string
      statusBlacklisted: string
      statusBlocked: string
      statusActive: string
      open: string
      back: string
      backToUsers: string
      notFound: string
      blockedReason: string
      blacklistedReason: string
    }
    verifyDevice: {
      title: string
      description: string
      codePlaceholder: string
      submit: string
      errors: {
        invalidCode: string
        config: string
        deviceSaveFailed: string
        fallback: string
      }
    }
    createAdmin: {
      title: string
      namePlaceholder: string
      passwordPlaceholder: string
      submit: string
      submitting: string
      success: string
      unknownError: string
    }
    userActions: {
      unknownError: string
      blockReason: string
      block: string
      unblock: string
      blacklistReason: string
      blacklist: string
      hardDelete: string
      removeAdmin: string
      blocked: string
      unblocked: string
      blacklisted: string
      deleted: string
      adminRemoved: string
    }
    userGroups: {
      createdGroups: string
      noCreatedGroups: string
      memberGroups: string
      noMemberGroups: string
      leader: string
      rolePrefix: string
      openAsApp: string
      noName: string
      noEmail: string
    }
    i18n: {
      pageTitle: string
      pageDescription: string
      fallbackSuccess: string
      fallbackError: string
      loadingLanguages: string
      loadingMatrix: string
      loadingAudit: string
      importExportTitle: string
      exportJson: string
      importJson: string
      auditTitle: string
      noAudit: string
      addLanguage: string
      saveLanguage: string
      noLanguages: string
      enabled: string
      disabled: string
      defaultLanguage: string
      systemLanguage: string
      disable: string
      enable: string
      delete: string
      bootstrapCatalog: string
      coverageLabel: string
      generateDrafts: string
      selectAll: string
      selectedRows: string
      targetLanguage: string
      disableSelected: string
      deleteSelected: string
      englishShort: string
      ukrainianShort: string
      russianShort: string
      addVariable: string
      variableDescriptionPlaceholder: string
      sourceTextPlaceholder: string
      saveVariable: string
      saveSource: string
      matrixTitle: string
      noVariables: string
      noDescription: string
      variableEnabled: string
      variableDisabled: string
      translationEnabled: string
      translationDisabled: string
      translationMissing: string
      enterTranslation: string
      save: string
      statusDraft: string
      statusNeedsReview: string
      statusPublished: string
      providerLabel: string
      disableTranslation: string
      enableTranslation: string
      deleteTranslation: string
    }
    languages: {
      title: string
      searchPlaceholder: string
      addBtn: string
      selected: string
      translate: string
      enable: string
      disable: string
      delete: string
      translateTitle: string
      emptyOnly: string
      emptyOnlyHint: string
      allValues: string
      allValuesHint: string
      cancel: string
      source: string
      system: string
      enabled: string
      disabled: string
      matrixTitle: string
      notFilled: string
      filterAll: string
      filterEmpty: string
      columnLanguage: string
      columnCode: string
      columnStatus: string
      columnCoverage: string
      columnKey: string
      columnEnglish: string
    }
    settings: {
      title: string
      description: string
      menuSite: string
      menuAccess: string
      menuIntegrations: string
      general: string
      contacts: string
      registration: string
      maintenance: string
      aiTranslation: string
      appName: string
      appSlogan: string
      contactEmail: string
      privacyUrl: string
      termsUrl: string
      allowRegistration: string
      allowRegistrationHint: string
      enableMaintenance: string
      enableMaintenanceHint: string
      maintenanceWarning: string
      maintenanceTitle: string
      maintenanceMessage: string
      maintenanceEta: string
      maintenanceEtaPlaceholder: string
      preview: string
      aiProvider: string
      aiApiKey: string
      providerAnthropic: string
      providerOpenai: string
      aiHint: string
      verify: string
      verifyValid: string
      verifyInvalid: string
      show: string
      hide: string
      currentKey: string
      save: string
      saved: string
    }
  }
}

export const translations: Record<StaticLocale, TranslationTree> = {
  uk: {
    app: {
      menu: 'Меню',
      account: 'Акаунт',
      main: 'Головне',
      administration: 'Адміністрування',
      logout: 'Завершити сеанс',
      verifyDevice: 'Підтвердити пристрій',
      setlistsongAdmin: 'BandSheet Admin',
      nav: {
        overview: 'Огляд',
        groups: 'Групи',
        library: 'Бібліотека',
        events: 'Події',
        profile: 'Профіль',
        settings: 'Налаштування сайту',
        users: 'Користувачі',
        languages: 'Мови і переклади',
        logs: 'Логи',
        adminPanel: 'Адмін-панель',
      },
      openMenu: 'Відкрити меню',
      closeMenu: 'Закрити меню',
      close: 'Закрити',
    },
    lang: {
      label: 'Мова',
      uk: 'Українська',
      ru: 'Русский',
      en: 'English',
    },
    dashboard: {
      greeting: 'Привіт,',
      myGroups: 'Мої групи',
      library: 'Бібліотека',
      mySongs: 'Мої пісні',
      libraryPreparing:
        'Інструменти бібліотеки готуються. Ви вже можете керувати групами та подіями.',
      events: 'Події',
      concerts: 'Концерти',
      profile: 'Профіль',
      settings: 'Налаштування',
      upcomingEvents: 'Найближчі події',
      noEvents: 'Активних подій поки немає',
      createGroup: 'Створити групу →',
      active: 'Активна',
      groups: (n) => `${n} груп`,
    },
    events: {
      back: '← Події',
      noSetlist: 'Сетліст ще не сформовано',
      setlist: 'Сетліст',
      statusDraft: 'Чернетка',
      statusActive: 'Активна',
      statusArchived: 'Архів',
      key: 'Тональність',
      noDate: 'Дата не вказана',
      noVenue: 'Місце не вказано',
    },
    library: {
      title: 'Бібліотека',
      searchPlaceholder: 'Пошук пісень за назвою або виконавцем...',
      searchButton: 'Пошук',
      searchResults: 'Результати пошуку',
      noResults: 'Нічого не знайдено',
      addToLibrary: 'Додати',
      added: 'Вже є',
      adding: 'Додаю...',
      remove: 'Видалити',
      removing: 'Видаляю...',
      addFailed: 'Не вдалося додати пісню',
      removeFailed: 'Не вдалося видалити пісню',
      myLibrary: 'Моя бібліотека',
      empty: 'Бібліотека порожня',
      emptyHint: 'Додайте пісні через пошук вище.',
      songKey: 'Тональність',
      songBpm: 'BPM',
    },
    profile: {
      title: 'Профіль',
      subtitle: 'Редагуйте вашу основну інформацію та налаштування інтерфейсу.',
      email: 'Email',
      bio: 'Про себе',
      interfaceSettings: 'Налаштування інтерфейсу',
      theme: 'Тема',
      themeSystem: 'Система',
      themeLight: 'Світла',
      themeDark: 'Темна',
      compactView: 'Компактний вигляд',
      showTimestamps: 'Показувати часові мітки',
      save: 'Зберегти',
      saving: 'Збереження...',
      saved: 'Збережено',
      loading: 'Завантаження...',
    },
    groups: {
      title: 'Групи',
      create: '+ Створити',
      noGroups: 'У тебе ще немає груп',
      createFirst: 'Створити першу групу',
      back: 'Назад',
      newTitle: 'Нова група',
      groupName: 'Назва групи',
      groupNamePlaceholder: 'Назва твоєї групи',
      creating: 'Створюю...',
      createSubmit: 'Створити групу',
      members: 'Учасники',
      membersCount: (n) => `${n} учасників`,
      unknownUser: 'Невідомий',
      inviteTitle: 'Запросити',
      pendingTitle: 'Очікують відповіді',
      roles: {
        leader: 'Лідер',
        deputy: 'Заступник',
        switcher: 'Перемикач',
        member: 'Учасник',
      },
      invite: {
        searchPlaceholder: "Почніть вводити ім'я або email",
        noName: 'Без імені',
        noUsersFound: 'Користувачів не знайдено',
        chooseUser: 'Оберіть користувача зі списку',
        sent: 'Запрошення надіслано!',
        sending: 'Надсилаю...',
        send: 'Надіслати запрошення',
        cancel: 'Скасувати',
        cancelling: 'Скасовую...',
        cancelConfirm: 'Скасувати це запрошення? Після цього людина не зможе приєднатися за ним.',
      },
    },
    auth: {
      subtitle: 'OPEN. PLAY. SHINE.',
      updatePasswordTitle: 'Оновлення пароля',
      newPassword: 'Новий пароль',
      confirmPassword: 'Підтвердити пароль',
      savePassword: 'Зберегти пароль',
      savingPassword: 'Зберігаю...',
      passwordTooShort: 'Пароль має бути не менше 6 символів',
      passwordsDoNotMatch: 'Паролі не співпадають',
      loginTitle: 'Вхід',
      passwordUpdated: 'Пароль успішно оновлено. Тепер увійдіть з новим паролем.',
      invalidLink: 'Посилання недійсне або протерміноване. Запросіть новий лист.',
      accountBlocked: 'Ваш акаунт заблоковано. Зверніться до адміністратора.',
      passwordLabel: 'Пароль',
      forgotPassword: 'Забули пароль?',
      loginSubmitting: 'Входжу...',
      loginSubmit: 'Увійти',
      noAccount: 'Ще немає акаунту?',
      registerLink: 'Зареєструватись',
      registerTitle: 'Реєстрація',
      nameLabel: "Ім'я",
      namePlaceholder: 'Олексій',
      passwordPlaceholder: 'мінімум 6 символів',
      registerSubmitting: 'Реєструю...',
      registerSubmit: 'Створити акаунт',
      registerDuplicateEmail:
        'Цей email вже зареєстрований. Якщо це ваш акаунт, спробуйте увійти або відновити пароль.',
      hasAccount: 'Вже є акаунт?',
      loginLink: 'Увійти',
      forgotTitle: 'Відновлення пароля',
      forgotDescription: 'Введіть email, і ми надішлемо посилання для встановлення нового пароля.',
      forgotSent: 'Лист відправлено. Перевірте пошту та перейдіть за посиланням.',
      forgotSubmitting: 'Надсилаю...',
      forgotSubmit: 'Надіслати посилання',
      backToLogin: 'Повернутися до входу',
      checkEmailTitle: 'Перевір пошту',
      checkEmailDescription:
        'Ми надіслали посилання для підтвердження на твій email. Натисни на нього, щоб активувати акаунт.',
      checkEmailConfirmed: 'Вже підтвердив?',
      resetTitle: 'Новий пароль',
      resetDescription: 'Введіть новий пароль для вашого акаунту.',
      resetPlaceholder: 'мінімум 6 символів',
      resetConfirmLabel: 'Підтвердіть пароль',
      resetConfirmPlaceholder: 'повторіть пароль',
      resetSubmitting: 'Зберігаю...',
      resetSubmit: 'Оновити пароль',
    },
    errors: {
      appLoadFailed: 'Не вдалося завантажити сторінку',
      appRetry: 'Спробувати знову',
      authFailed: 'Помилка авторизації',
      authRetry: 'Спробувати ще раз',
      adminFailed: 'Помилка в адмін-панелі',
      adminRefresh: 'Оновити',
    },
    admin: {
      layout: {
        panelTitle: 'Адмін-панель',
        signedInAs: 'Вхід',
        defaultActorName: 'Адміністратор',
      },
      users: {
        tableUser: 'Користувач',
        tableRole: 'Роль',
        tableStatus: 'Статус',
        tableActions: 'Дії',
        noName: 'Без імені',
        noEmail: 'email не вказано',
        roleRootAdmin: 'Головний адміністратор',
        roleAdmin: 'Адміністратор',
        roleUser: 'Користувач',
        statusBlacklisted: 'Чорний список',
        statusBlocked: 'Заблокований',
        statusActive: 'Активний',
        open: 'Відкрити',
        back: '← Назад',
        backToUsers: '← Назад до користувачів',
        notFound: 'Користувача не знайдено',
        blockedReason: 'Причина блокування',
        blacklistedReason: 'Причина чорного списку',
      },
      verifyDevice: {
        title: 'Підтвердження входу адміністратора',
        description:
          'Це другий крок авторизації. Введіть код безпеки, після чого пристрій буде збережений як довірений.',
        codePlaceholder: 'Код другого кроку',
        submit: 'Підтвердити пристрій',
        errors: {
          invalidCode: 'Невірний код другого кроку. Спробуйте ще раз.',
          config:
            'Код другого кроку не налаштовано на сервері. Зверніться до адміністратора системи.',
          deviceSaveFailed: 'Не вдалося підтвердити пристрій. Спробуйте ще раз пізніше.',
          fallback: 'Сталася помилка. Спробуйте ще раз.',
        },
      },
      createAdmin: {
        title: 'Створити адміністратора',
        namePlaceholder: "Ім'я",
        passwordPlaceholder: 'Складний пароль',
        submit: 'Створити',
        submitting: 'Створюю...',
        success: 'Адміністратора створено',
        unknownError: 'Сталася помилка під час виконання дії',
      },
      userActions: {
        unknownError: 'Сталася помилка під час виконання дії',
        blockReason: 'Причина блокування',
        block: 'Блокувати',
        unblock: 'Розблокувати',
        blacklistReason: 'Причина чорного списку',
        blacklist: 'У чорний список',
        hardDelete: 'Повне видалення',
        removeAdmin: 'Забрати права адміністратора',
        blocked: 'Користувача заблоковано',
        unblocked: 'Користувача розблоковано',
        blacklisted: 'Користувача внесено у чорний список',
        deleted: 'Користувача видалено',
        adminRemoved: 'Права адміністратора знято',
      },
      userGroups: {
        createdGroups: 'Створені групи',
        noCreatedGroups: 'Немає створених груп',
        memberGroups: 'Групи участі',
        noMemberGroups: 'Не бере участі в групах',
        leader: 'Лідер',
        rolePrefix: 'Роль',
        openAsApp: 'Відкрити як у застосунку',
        noName: 'Без імені',
        noEmail: 'email не вказано',
      },
      i18n: {
        pageTitle: 'Мови і переклади',
        pageDescription:
          'Формат: одна змінна (`app.nav.users`) і багато перекладів за мовами. Можна додавати, вимикати і видаляти мови, змінні та окремі переклади.',
        fallbackSuccess: 'Операцію виконано',
        fallbackError: 'Сталася помилка',
        loadingLanguages: 'Завантаження мов...',
        loadingMatrix: 'Завантаження матриці перекладів...',
        loadingAudit: 'Завантаження аудиту...',
        importExportTitle: 'Імпорт / Експорт',
        exportJson: 'Експорт JSON',
        importJson: 'Імпортувати JSON',
        auditTitle: 'Аудит змін перекладів',
        noAudit: 'Записів поки немає',
        addLanguage: 'Додати мову',
        saveLanguage: 'Зберегти мову',
        noLanguages: 'Мов поки немає',
        enabled: 'увімкнено',
        disabled: 'вимкнено',
        defaultLanguage: 'default',
        systemLanguage: 'system',
        disable: 'Вимкнути',
        enable: 'Увімкнути',
        delete: 'Видалити',
        bootstrapCatalog: 'Синхронізувати built-in каталог',
        coverageLabel: 'Покриття',
        generateDrafts: 'Виконати переклад',
        selectAll: 'Вибрати все',
        selectedRows: 'Вибрано рядків',
        targetLanguage: 'Цільова мова',
        disableSelected: 'Вимкнути переклади',
        deleteSelected: 'Видалити переклади',
        englishShort: 'Анг',
        ukrainianShort: 'Укр',
        russianShort: 'Рус',
        addVariable: 'Додати змінну перекладу',
        variableDescriptionPlaceholder: 'Пункт меню «Мови і переклади»',
        sourceTextPlaceholder: 'Source text in English',
        saveVariable: 'Зберегти змінну',
        saveSource: 'Зберегти source',
        matrixTitle: 'Матриця перекладів',
        noVariables: 'Змінних поки немає',
        noDescription: 'Без опису',
        variableEnabled: 'змінна увімкнена',
        variableDisabled: 'змінна вимкнена',
        translationEnabled: 'переклад увімкнено',
        translationDisabled: 'переклад вимкнено',
        translationMissing: 'переклад ще не задано',
        enterTranslation: 'Введіть переклад',
        save: 'Зберегти',
        statusDraft: 'Чернетка',
        statusNeedsReview: 'Потребує перевірки',
        statusPublished: 'Опубліковано',
        providerLabel: 'Провайдер',
        disableTranslation: 'Вимкнути переклад',
        enableTranslation: 'Увімкнути переклад',
        deleteTranslation: 'Видалити переклад',
      },
      languages: {
        title: 'Мови і переклади',
        searchPlaceholder: 'Пошук мови для додавання...',
        addBtn: '+ Додати',
        selected: 'Вибрано',
        translate: 'Перевести',
        enable: 'Увімкнути',
        disable: 'Вимкнути',
        delete: 'Видалити',
        translateTitle: 'Перекласти мову',
        emptyOnly: 'Тільки порожні значення',
        emptyOnlyHint: 'Перекласти тільки ті ключі де переклад відсутній',
        allValues: 'Всю мову',
        allValuesHint: 'Замінити всі існуючі переклади новими',
        cancel: 'Скасувати',
        source: 'source',
        system: 'System',
        enabled: '✓ Увімкнено',
        disabled: 'Вимкнено',
        matrixTitle: 'Матриця перекладів',
        notFilled: 'не заповнено',
        filterAll: 'Всі',
        filterEmpty: 'Порожні',
        columnLanguage: 'Мова',
        columnCode: 'Код',
        columnStatus: 'Статус',
        columnCoverage: 'Покриття',
        columnKey: 'Ключ',
        columnEnglish: 'English',
      },
      settings: {
        title: 'Налаштування сайту',
        description: 'Керуйте глобальними параметрами проекту, що відображаються по всьому сайту.',
        menuSite: 'Site',
        menuAccess: 'Access',
        menuIntegrations: 'Integrations',
        general: 'General',
        contacts: 'Contacts',
        registration: 'Registration',
        maintenance: 'Maintenance',
        aiTranslation: 'AI Translation',
        appName: 'Назва сайту',
        appSlogan: 'Слоган',
        contactEmail: 'Support email',
        privacyUrl: 'Privacy Policy URL',
        termsUrl: 'Terms of Service URL',
        allowRegistration: 'Дозволити нові реєстрації',
        allowRegistrationHint: 'Якщо вимкнено, нові користувачі не зможуть зареєструватися',
        enableMaintenance: 'Увімкнути maintenance mode',
        enableMaintenanceHint: 'Поки режим увімкнений, користувачі бачитимуть технічну сторінку',
        maintenanceWarning: '⚠ Maintenance mode is ON — visitors cannot access the site',
        maintenanceTitle: 'Title',
        maintenanceMessage: 'Message',
        maintenanceEta: 'Expected completion time',
        maintenanceEtaPlaceholder: 'e.g. 15:00, March 16 2026',
        preview: 'Preview',
        aiProvider: 'Provider',
        aiApiKey: 'API Key',
        providerAnthropic: 'Anthropic (Claude)',
        providerOpenai: 'OpenAI (GPT)',
        aiHint: 'Used for automatic translation of interface variables from English',
        verify: 'Verify',
        verifyValid: '✓ Valid',
        verifyInvalid: '✗ Invalid',
        show: 'Показати',
        hide: 'Сховати',
        currentKey: 'Поточний ключ',
        save: 'Зберегти',
        saved: 'Збережено',
      },
    },
  },
  ru: {
    app: {
      menu: 'Меню',
      account: 'Аккаунт',
      main: 'Основное',
      administration: 'Администрирование',
      logout: 'Завершить сеанс',
      verifyDevice: 'Подтвердить устройство',
      setlistsongAdmin: 'BandSheet Admin',
      nav: {
        overview: 'Обзор',
        groups: 'Группы',
        library: 'Библиотека',
        events: 'События',
        profile: 'Профиль',
        settings: 'Настройки сайта',
        users: 'Пользователи',
        languages: 'Языки и переводы',
        logs: 'Логи',
        adminPanel: 'Админ-панель',
      },
      openMenu: 'Открыть меню',
      closeMenu: 'Закрыть меню',
      close: 'Закрыть',
    },
    lang: {
      label: 'Язык',
      uk: 'Украинский',
      ru: 'Русский',
      en: 'English',
    },
    dashboard: {
      greeting: 'Привет,',
      myGroups: 'Мои группы',
      library: 'Библиотека',
      mySongs: 'Мои песни',
      libraryPreparing:
        'Инструменты библиотеки готовятся. Вы уже можете управлять группами и событиями.',
      events: 'События',
      concerts: 'Концерты',
      profile: 'Профиль',
      settings: 'Настройки',
      upcomingEvents: 'Ближайшие события',
      noEvents: 'Активных событий пока нет',
      createGroup: 'Создать группу →',
      active: 'Активно',
      groups: (n) => `${n} групп`,
    },
    events: {
      back: '← События',
      noSetlist: 'Сетлист ещё не сформирован',
      setlist: 'Сетлист',
      statusDraft: 'Черновик',
      statusActive: 'Активно',
      statusArchived: 'Архив',
      key: 'Тональность',
      noDate: 'Дата не указана',
      noVenue: 'Место не указано',
    },
    library: {
      title: 'Библиотека',
      searchPlaceholder: 'Поиск песен по названию или исполнителю...',
      searchButton: 'Поиск',
      searchResults: 'Результаты поиска',
      noResults: 'Ничего не найдено',
      addToLibrary: 'Добавить',
      added: 'Уже есть',
      adding: 'Добавляю...',
      remove: 'Удалить',
      removing: 'Удаляю...',
      addFailed: 'Не удалось добавить песню',
      removeFailed: 'Не удалось удалить песню',
      myLibrary: 'Моя библиотека',
      empty: 'Библиотека пустая',
      emptyHint: 'Добавьте песни через поиск выше.',
      songKey: 'Тональность',
      songBpm: 'BPM',
    },
    profile: {
      title: 'Профиль',
      subtitle: 'Редактируйте вашу основную информацию и настройки интерфейса.',
      email: 'Email',
      bio: 'О себе',
      interfaceSettings: 'Настройки интерфейса',
      theme: 'Тема',
      themeSystem: 'Система',
      themeLight: 'Светлая',
      themeDark: 'Тёмная',
      compactView: 'Компактный вид',
      showTimestamps: 'Показывать отметки времени',
      save: 'Сохранить',
      saving: 'Сохранение...',
      saved: 'Сохранено',
      loading: 'Загрузка...',
    },
    groups: {
      title: 'Группы',
      create: '+ Создать',
      noGroups: 'У тебя ещё нет групп',
      createFirst: 'Создать первую группу',
      back: 'Назад',
      newTitle: 'Новая группа',
      groupName: 'Название группы',
      groupNamePlaceholder: 'Название твоей группы',
      creating: 'Создаю...',
      createSubmit: 'Создать группу',
      members: 'Участники',
      membersCount: (n) => `${n} участников`,
      unknownUser: 'Неизвестный',
      inviteTitle: 'Пригласить',
      pendingTitle: 'Ожидают ответа',
      roles: {
        leader: 'Лидер',
        deputy: 'Заместитель',
        switcher: 'Переключатель',
        member: 'Участник',
      },
      invite: {
        searchPlaceholder: 'Начните вводить имя или email',
        noName: 'Без имени',
        noUsersFound: 'Пользователи не найдены',
        chooseUser: 'Выберите пользователя из списка',
        sent: 'Приглашение отправлено!',
        sending: 'Отправляю...',
        send: 'Отправить приглашение',
        cancel: 'Отменить',
        cancelling: 'Отменяю...',
        cancelConfirm:
          'Отменить это приглашение? После этого человек не сможет присоединиться по нему.',
      },
    },
    auth: {
      subtitle: 'OPEN. PLAY. SHINE.',
      updatePasswordTitle: 'Обновление пароля',
      newPassword: 'Новый пароль',
      confirmPassword: 'Подтвердите пароль',
      savePassword: 'Сохранить пароль',
      savingPassword: 'Сохраняю...',
      passwordTooShort: 'Пароль должен быть не менее 6 символов',
      passwordsDoNotMatch: 'Пароли не совпадают',
      loginTitle: 'Вход',
      passwordUpdated: 'Пароль успешно обновлён. Теперь войдите с новым паролем.',
      invalidLink: 'Ссылка недействительна или истекла. Запросите новое письмо.',
      accountBlocked: 'Ваш аккаунт заблокирован. Обратитесь к администратору.',
      passwordLabel: 'Пароль',
      forgotPassword: 'Забыли пароль?',
      loginSubmitting: 'Вхожу...',
      loginSubmit: 'Войти',
      noAccount: 'Еще нет аккаунта?',
      registerLink: 'Зарегистрироваться',
      registerTitle: 'Регистрация',
      nameLabel: 'Имя',
      namePlaceholder: 'Алексей',
      passwordPlaceholder: 'минимум 6 символов',
      registerSubmitting: 'Регистрирую...',
      registerSubmit: 'Создать аккаунт',
      registerDuplicateEmail:
        'Этот email уже зарегистрирован. Если это ваш аккаунт, попробуйте войти или восстановить пароль.',
      hasAccount: 'Уже есть аккаунт?',
      loginLink: 'Войти',
      forgotTitle: 'Восстановление пароля',
      forgotDescription: 'Введите email, и мы отправим ссылку для установки нового пароля.',
      forgotSent: 'Письмо отправлено. Проверьте почту и перейдите по ссылке.',
      forgotSubmitting: 'Отправляю...',
      forgotSubmit: 'Отправить ссылку',
      backToLogin: 'Вернуться ко входу',
      checkEmailTitle: 'Проверьте почту',
      checkEmailDescription:
        'Мы отправили ссылку для подтверждения на ваш email. Нажмите на нее, чтобы активировать аккаунт.',
      checkEmailConfirmed: 'Уже подтвердили?',
      resetTitle: 'Новый пароль',
      resetDescription: 'Введите новый пароль для вашего аккаунта.',
      resetPlaceholder: 'минимум 6 символов',
      resetConfirmLabel: 'Подтвердите пароль',
      resetConfirmPlaceholder: 'повторите пароль',
      resetSubmitting: 'Сохраняю...',
      resetSubmit: 'Обновить пароль',
    },
    errors: {
      appLoadFailed: 'Не удалось загрузить страницу',
      appRetry: 'Попробовать снова',
      authFailed: 'Ошибка авторизации',
      authRetry: 'Попробовать еще раз',
      adminFailed: 'Ошибка в админ-панели',
      adminRefresh: 'Обновить',
    },
    admin: {
      layout: {
        panelTitle: 'Админ-панель',
        signedInAs: 'Вход',
        defaultActorName: 'Администратор',
      },
      users: {
        tableUser: 'Пользователь',
        tableRole: 'Роль',
        tableStatus: 'Статус',
        tableActions: 'Действия',
        noName: 'Без имени',
        noEmail: 'email не указан',
        roleRootAdmin: 'Главный администратор',
        roleAdmin: 'Администратор',
        roleUser: 'Пользователь',
        statusBlacklisted: 'Черный список',
        statusBlocked: 'Заблокирован',
        statusActive: 'Активный',
        open: 'Открыть',
        back: '← Назад',
        backToUsers: '← Назад к пользователям',
        notFound: 'Пользователь не найден',
        blockedReason: 'Причина блокировки',
        blacklistedReason: 'Причина черного списка',
      },
      verifyDevice: {
        title: 'Подтверждение входа администратора',
        description:
          'Это второй шаг авторизации. Введите код безопасности, после чего устройство будет сохранено как доверенное.',
        codePlaceholder: 'Код второго шага',
        submit: 'Подтвердить устройство',
        errors: {
          invalidCode: 'Неверный код второго шага. Попробуйте еще раз.',
          config: 'Код второго шага не настроен на сервере. Обратитесь к администратору системы.',
          deviceSaveFailed: 'Не удалось подтвердить устройство. Попробуйте еще раз позже.',
          fallback: 'Произошла ошибка. Попробуйте еще раз.',
        },
      },
      createAdmin: {
        title: 'Создать администратора',
        namePlaceholder: 'Имя',
        passwordPlaceholder: 'Сложный пароль',
        submit: 'Создать',
        submitting: 'Создаю...',
        success: 'Администратор создан',
        unknownError: 'Произошла ошибка при выполнении действия',
      },
      userActions: {
        unknownError: 'Произошла ошибка при выполнении действия',
        blockReason: 'Причина блокировки',
        block: 'Заблокировать',
        unblock: 'Разблокировать',
        blacklistReason: 'Причина черного списка',
        blacklist: 'В черный список',
        hardDelete: 'Полное удаление',
        removeAdmin: 'Снять права администратора',
        blocked: 'Пользователь заблокирован',
        unblocked: 'Пользователь разблокирован',
        blacklisted: 'Пользователь внесен в черный список',
        deleted: 'Пользователь удален',
        adminRemoved: 'Права администратора сняты',
      },
      userGroups: {
        createdGroups: 'Созданные группы',
        noCreatedGroups: 'Нет созданных групп',
        memberGroups: 'Группы участия',
        noMemberGroups: 'Не участвует в группах',
        leader: 'Лидер',
        rolePrefix: 'Роль',
        openAsApp: 'Открыть как в приложении',
        noName: 'Без имени',
        noEmail: 'email не указан',
      },
      i18n: {
        pageTitle: 'Языки и переводы',
        pageDescription:
          'Формат: одна переменная (`app.nav.users`) и множество переводов по языкам. Можно добавлять, отключать и удалять языки, переменные и отдельные переводы.',
        fallbackSuccess: 'Операция выполнена',
        fallbackError: 'Произошла ошибка',
        loadingLanguages: 'Загрузка языков...',
        loadingMatrix: 'Загрузка матрицы переводов...',
        loadingAudit: 'Загрузка аудита...',
        importExportTitle: 'Импорт / Экспорт',
        exportJson: 'Экспорт JSON',
        importJson: 'Импортировать JSON',
        auditTitle: 'Аудит изменений переводов',
        noAudit: 'Записей пока нет',
        addLanguage: 'Добавить язык',
        saveLanguage: 'Сохранить язык',
        noLanguages: 'Языков пока нет',
        enabled: 'включен',
        disabled: 'отключен',
        defaultLanguage: 'default',
        systemLanguage: 'system',
        disable: 'Отключить',
        enable: 'Включить',
        delete: 'Удалить',
        bootstrapCatalog: 'Синхронизировать built-in каталог',
        coverageLabel: 'Покрытие',
        generateDrafts: 'Произвести перевод',
        selectAll: 'Выбрать все',
        selectedRows: 'Выбрано строк',
        targetLanguage: 'Целевой язык',
        disableSelected: 'Отключить переводы',
        deleteSelected: 'Удалить переводы',
        englishShort: 'Анг',
        ukrainianShort: 'Укр',
        russianShort: 'Рус',
        addVariable: 'Добавить переменную перевода',
        variableDescriptionPlaceholder: 'Пункт меню «Языки и переводы»',
        sourceTextPlaceholder: 'Source text in English',
        saveVariable: 'Сохранить переменную',
        saveSource: 'Сохранить source',
        matrixTitle: 'Матрица переводов',
        noVariables: 'Переменных пока нет',
        noDescription: 'Без описания',
        variableEnabled: 'переменная включена',
        variableDisabled: 'переменная отключена',
        translationEnabled: 'перевод включен',
        translationDisabled: 'перевод отключен',
        translationMissing: 'перевод еще не задан',
        enterTranslation: 'Введите перевод',
        save: 'Сохранить',
        statusDraft: 'Черновик',
        statusNeedsReview: 'Нужна проверка',
        statusPublished: 'Опубликовано',
        providerLabel: 'Провайдер',
        disableTranslation: 'Отключить перевод',
        enableTranslation: 'Включить перевод',
        deleteTranslation: 'Удалить перевод',
      },
      languages: {
        title: 'Языки и переводы',
        searchPlaceholder: 'Поиск языка для добавления...',
        addBtn: '+ Добавить',
        selected: 'Выбрано',
        translate: 'Перевести',
        enable: 'Включить',
        disable: 'Отключить',
        delete: 'Удалить',
        translateTitle: 'Перевести язык',
        emptyOnly: 'Только пустые значения',
        emptyOnlyHint: 'Перевести только те ключи, где перевод отсутствует',
        allValues: 'Весь язык',
        allValuesHint: 'Заменить все существующие переводы новыми',
        cancel: 'Отмена',
        source: 'source',
        system: 'System',
        enabled: '✓ Включено',
        disabled: 'Отключено',
        matrixTitle: 'Матрица переводов',
        notFilled: 'не заполнено',
        filterAll: 'Все',
        filterEmpty: 'Пустые',
        columnLanguage: 'Язык',
        columnCode: 'Код',
        columnStatus: 'Статус',
        columnCoverage: 'Покрытие',
        columnKey: 'Ключ',
        columnEnglish: 'English',
      },
      settings: {
        title: 'Настройки сайта',
        description:
          'Управляйте глобальными параметрами проекта, которые отображаются на всём сайте.',
        menuSite: 'Site',
        menuAccess: 'Access',
        menuIntegrations: 'Integrations',
        general: 'General',
        contacts: 'Contacts',
        registration: 'Registration',
        maintenance: 'Maintenance',
        aiTranslation: 'AI Translation',
        appName: 'Название сайта',
        appSlogan: 'Слоган',
        contactEmail: 'Support email',
        privacyUrl: 'Privacy Policy URL',
        termsUrl: 'Terms of Service URL',
        allowRegistration: 'Разрешить новые регистрации',
        allowRegistrationHint: 'Если отключено, новые пользователи не смогут зарегистрироваться',
        enableMaintenance: 'Включить maintenance mode',
        enableMaintenanceHint: 'Пока режим включен, пользователи будут видеть техническую страницу',
        maintenanceWarning: '⚠ Maintenance mode is ON — visitors cannot access the site',
        maintenanceTitle: 'Title',
        maintenanceMessage: 'Message',
        maintenanceEta: 'Expected completion time',
        maintenanceEtaPlaceholder: 'e.g. 15:00, March 16 2026',
        preview: 'Preview',
        aiProvider: 'Provider',
        aiApiKey: 'API Key',
        providerAnthropic: 'Anthropic (Claude)',
        providerOpenai: 'OpenAI (GPT)',
        aiHint: 'Used for automatic translation of interface variables from English',
        verify: 'Verify',
        verifyValid: '✓ Valid',
        verifyInvalid: '✗ Invalid',
        show: 'Показать',
        hide: 'Скрыть',
        currentKey: 'Текущий ключ',
        save: 'Сохранить',
        saved: 'Сохранено',
      },
    },
  },
  en: {
    app: {
      menu: 'Menu',
      account: 'Account',
      main: 'Main',
      administration: 'Administration',
      logout: 'Sign out',
      verifyDevice: 'Verify device',
      setlistsongAdmin: 'BandSheet Admin',
      nav: {
        overview: 'Overview',
        groups: 'Groups',
        library: 'Library',
        events: 'Events',
        profile: 'Profile',
        settings: 'Site settings',
        users: 'Users',
        languages: 'Languages & Translations',
        logs: 'Logs',
        adminPanel: 'Admin panel',
      },
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      close: 'Close',
    },
    lang: {
      label: 'Language',
      uk: 'Ukrainian',
      ru: 'Russian',
      en: 'English',
    },
    dashboard: {
      greeting: 'Hello,',
      myGroups: 'My groups',
      library: 'Library',
      mySongs: 'My songs',
      libraryPreparing:
        'Library tools are being prepared. You can already manage groups and events.',
      events: 'Events',
      concerts: 'Concerts',
      profile: 'Profile',
      settings: 'Settings',
      upcomingEvents: 'Upcoming events',
      noEvents: 'No active events yet',
      createGroup: 'Create a group →',
      active: 'Active',
      groups: (n) => `${n} groups`,
    },
    events: {
      back: '← Events',
      noSetlist: 'No setlist created for this event',
      setlist: 'Setlist',
      statusDraft: 'Draft',
      statusActive: 'Active',
      statusArchived: 'Archived',
      key: 'Key',
      noDate: 'Date not set',
      noVenue: 'Venue not set',
    },
    library: {
      title: 'Library',
      searchPlaceholder: 'Search songs by title or artist...',
      searchButton: 'Search',
      searchResults: 'Search results',
      noResults: 'No results found',
      addToLibrary: 'Add',
      added: 'Added',
      adding: 'Adding...',
      remove: 'Remove',
      removing: 'Removing...',
      addFailed: 'Failed to add song',
      removeFailed: 'Failed to remove song',
      myLibrary: 'My library',
      empty: 'Library is empty',
      emptyHint: 'Add songs using search above.',
      songKey: 'Key',
      songBpm: 'BPM',
    },
    profile: {
      title: 'Profile',
      subtitle: 'Edit your basic information and interface settings.',
      email: 'Email',
      bio: 'About me',
      interfaceSettings: 'Interface settings',
      theme: 'Theme',
      themeSystem: 'System',
      themeLight: 'Light',
      themeDark: 'Dark',
      compactView: 'Compact view',
      showTimestamps: 'Show timestamps',
      save: 'Save',
      saving: 'Saving...',
      saved: 'Saved',
      loading: 'Loading...',
    },
    groups: {
      title: 'Groups',
      create: '+ Create',
      noGroups: "You don't have any groups yet",
      createFirst: 'Create your first group',
      back: 'Back',
      newTitle: 'New group',
      groupName: 'Group name',
      groupNamePlaceholder: 'Your group name',
      creating: 'Creating...',
      createSubmit: 'Create group',
      members: 'Members',
      membersCount: (n) => `${n} members`,
      unknownUser: 'Unknown',
      inviteTitle: 'Invite',
      pendingTitle: 'Pending responses',
      roles: {
        leader: 'Leader',
        deputy: 'Deputy',
        switcher: 'Switcher',
        member: 'Member',
      },
      invite: {
        searchPlaceholder: 'Start typing name or email',
        noName: 'No name',
        noUsersFound: 'No users found',
        chooseUser: 'Select a user from the list',
        sent: 'Invitation sent!',
        sending: 'Sending...',
        send: 'Send invitation',
        cancel: 'Cancel',
        cancelling: 'Cancelling...',
        cancelConfirm:
          'Cancel this invitation? After that, the person will not be able to join with it.',
      },
    },
    auth: {
      subtitle: 'OPEN. PLAY. SHINE.',
      updatePasswordTitle: 'Update password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
      savePassword: 'Save password',
      savingPassword: 'Saving...',
      passwordTooShort: 'Password must be at least 6 characters',
      passwordsDoNotMatch: 'Passwords do not match',
      loginTitle: 'Sign in',
      passwordUpdated: 'Password updated successfully. You can now sign in with your new password.',
      invalidLink: 'The link is invalid or has expired. Request a new email.',
      accountBlocked: 'Your account has been blocked. Contact an administrator.',
      passwordLabel: 'Password',
      forgotPassword: 'Forgot password?',
      loginSubmitting: 'Signing in...',
      loginSubmit: 'Sign in',
      noAccount: "Don't have an account yet?",
      registerLink: 'Sign up',
      registerTitle: 'Sign up',
      nameLabel: 'Name',
      namePlaceholder: 'Alex',
      passwordPlaceholder: 'at least 6 characters',
      registerSubmitting: 'Signing up...',
      registerSubmit: 'Create account',
      registerDuplicateEmail:
        'This email is already registered. If this is your account, try signing in or resetting your password.',
      hasAccount: 'Already have an account?',
      loginLink: 'Sign in',
      forgotTitle: 'Password recovery',
      forgotDescription: 'Enter your email and we will send a link to set a new password.',
      forgotSent: 'Email sent. Check your inbox and follow the link.',
      forgotSubmitting: 'Sending...',
      forgotSubmit: 'Send link',
      backToLogin: 'Back to sign in',
      checkEmailTitle: 'Check your email',
      checkEmailDescription:
        'We sent a confirmation link to your email. Click it to activate your account.',
      checkEmailConfirmed: 'Already confirmed?',
      resetTitle: 'New password',
      resetDescription: 'Enter a new password for your account.',
      resetPlaceholder: 'at least 6 characters',
      resetConfirmLabel: 'Confirm password',
      resetConfirmPlaceholder: 'repeat password',
      resetSubmitting: 'Saving...',
      resetSubmit: 'Update password',
    },
    errors: {
      appLoadFailed: 'Failed to load page',
      appRetry: 'Try again',
      authFailed: 'Authorization error',
      authRetry: 'Try again',
      adminFailed: 'Admin panel error',
      adminRefresh: 'Refresh',
    },
    admin: {
      layout: {
        panelTitle: 'Admin panel',
        signedInAs: 'Signed in',
        defaultActorName: 'Administrator',
      },
      users: {
        tableUser: 'User',
        tableRole: 'Role',
        tableStatus: 'Status',
        tableActions: 'Actions',
        noName: 'No name',
        noEmail: 'email not specified',
        roleRootAdmin: 'Root administrator',
        roleAdmin: 'Administrator',
        roleUser: 'User',
        statusBlacklisted: 'Blacklisted',
        statusBlocked: 'Blocked',
        statusActive: 'Active',
        open: 'Open',
        back: '← Back',
        backToUsers: '← Back to users',
        notFound: 'User not found',
        blockedReason: 'Block reason',
        blacklistedReason: 'Blacklist reason',
      },
      verifyDevice: {
        title: 'Admin sign-in verification',
        description:
          'This is the second authorization step. Enter the security code, then this device will be saved as trusted.',
        codePlaceholder: 'Second-step code',
        submit: 'Verify device',
        errors: {
          invalidCode: 'Invalid second-step code. Please try again.',
          config:
            'Second-step code is not configured on the server. Contact your system administrator.',
          deviceSaveFailed: 'Failed to verify the device. Please try again later.',
          fallback: 'Something went wrong. Please try again.',
        },
      },
      createAdmin: {
        title: 'Create administrator',
        namePlaceholder: 'Name',
        passwordPlaceholder: 'Strong password',
        submit: 'Create',
        submitting: 'Creating...',
        success: 'Administrator created',
        unknownError: 'An error occurred while performing this action',
      },
      userActions: {
        unknownError: 'An error occurred while performing this action',
        blockReason: 'Block reason',
        block: 'Block',
        unblock: 'Unblock',
        blacklistReason: 'Blacklist reason',
        blacklist: 'Blacklist',
        hardDelete: 'Hard delete',
        removeAdmin: 'Remove admin rights',
        blocked: 'User has been blocked',
        unblocked: 'User has been unblocked',
        blacklisted: 'User has been blacklisted',
        deleted: 'User has been deleted',
        adminRemoved: 'Admin rights removed',
      },
      userGroups: {
        createdGroups: 'Created groups',
        noCreatedGroups: 'No created groups',
        memberGroups: 'Membership groups',
        noMemberGroups: 'Not a member of any groups',
        leader: 'Leader',
        rolePrefix: 'Role',
        openAsApp: 'Open in app view',
        noName: 'No name',
        noEmail: 'email not specified',
      },
      i18n: {
        pageTitle: 'Languages & Translations',
        pageDescription:
          'Format: one variable (`app.nav.users`) and many translations by language. You can add, disable, and delete languages, variables, and individual translations.',
        fallbackSuccess: 'Operation completed',
        fallbackError: 'Something went wrong',
        loadingLanguages: 'Loading languages...',
        loadingMatrix: 'Loading translation matrix...',
        loadingAudit: 'Loading audit...',
        importExportTitle: 'Import / Export',
        exportJson: 'Export JSON',
        importJson: 'Import JSON',
        auditTitle: 'Translation changes audit',
        noAudit: 'No records yet',
        addLanguage: 'Add language',
        saveLanguage: 'Save language',
        noLanguages: 'No languages yet',
        enabled: 'enabled',
        disabled: 'disabled',
        defaultLanguage: 'default',
        systemLanguage: 'system',
        disable: 'Disable',
        enable: 'Enable',
        delete: 'Delete',
        bootstrapCatalog: 'Sync built-in catalog',
        coverageLabel: 'Coverage',
        generateDrafts: 'Produce translation',
        selectAll: 'Select all',
        selectedRows: 'Selected rows',
        targetLanguage: 'Target language',
        disableSelected: 'Disable translations',
        deleteSelected: 'Delete translations',
        englishShort: 'Eng',
        ukrainianShort: 'Ukr',
        russianShort: 'Rus',
        addVariable: 'Add translation variable',
        variableDescriptionPlaceholder: 'Menu item "Languages & Translations"',
        sourceTextPlaceholder: 'Source text in English',
        saveVariable: 'Save variable',
        saveSource: 'Save source',
        matrixTitle: 'Translation matrix',
        noVariables: 'No variables yet',
        noDescription: 'No description',
        variableEnabled: 'variable enabled',
        variableDisabled: 'variable disabled',
        translationEnabled: 'translation enabled',
        translationDisabled: 'translation disabled',
        translationMissing: 'translation not set yet',
        enterTranslation: 'Enter translation',
        save: 'Save',
        statusDraft: 'Draft',
        statusNeedsReview: 'Needs review',
        statusPublished: 'Published',
        providerLabel: 'Provider',
        disableTranslation: 'Disable translation',
        enableTranslation: 'Enable translation',
        deleteTranslation: 'Delete translation',
      },
      languages: {
        title: 'Languages & Translations',
        searchPlaceholder: 'Search language to add...',
        addBtn: '+ Add',
        selected: 'Selected',
        translate: 'Translate',
        enable: 'Enable',
        disable: 'Disable',
        delete: 'Delete',
        translateTitle: 'Translate language',
        emptyOnly: 'Only empty values',
        emptyOnlyHint: 'Translate only keys where translation is missing',
        allValues: 'Whole language',
        allValuesHint: 'Replace all existing translations with new ones',
        cancel: 'Cancel',
        source: 'source',
        system: 'System',
        enabled: '✓ Enabled',
        disabled: 'Disabled',
        matrixTitle: 'Translation matrix',
        notFilled: 'not filled',
        filterAll: 'All',
        filterEmpty: 'Empty',
        columnLanguage: 'Language',
        columnCode: 'Code',
        columnStatus: 'Status',
        columnCoverage: 'Coverage',
        columnKey: 'Key',
        columnEnglish: 'English',
      },
      settings: {
        title: 'Site settings',
        description: 'Manage global project values that are shown across the whole site.',
        menuSite: 'Site',
        menuAccess: 'Access',
        menuIntegrations: 'Integrations',
        general: 'General',
        contacts: 'Contacts',
        registration: 'Registration',
        maintenance: 'Maintenance',
        aiTranslation: 'AI Translation',
        appName: 'Site name',
        appSlogan: 'Slogan',
        contactEmail: 'Support email',
        privacyUrl: 'Privacy Policy URL',
        termsUrl: 'Terms of Service URL',
        allowRegistration: 'Allow new registrations',
        allowRegistrationHint: 'If disabled, new users cannot sign up',
        enableMaintenance: 'Enable maintenance mode',
        enableMaintenanceHint: 'When enabled, visitors are redirected to the maintenance page',
        maintenanceWarning: '⚠ Maintenance mode is ON — visitors cannot access the site',
        maintenanceTitle: 'Title',
        maintenanceMessage: 'Message',
        maintenanceEta: 'Expected completion time',
        maintenanceEtaPlaceholder: 'e.g. 15:00, March 16 2026',
        preview: 'Preview',
        aiProvider: 'Provider',
        aiApiKey: 'API Key',
        providerAnthropic: 'Anthropic (Claude)',
        providerOpenai: 'OpenAI (GPT)',
        aiHint: 'Used for automatic translation of interface variables from English',
        verify: 'Verify',
        verifyValid: '✓ Valid',
        verifyInvalid: '✗ Invalid',
        show: 'Show',
        hide: 'Hide',
        currentKey: 'Current key',
        save: 'Save',
        saved: 'Saved',
      },
    },
  },
}

export const defaultLocale: StaticLocale = 'en'

export function isLocale(value: unknown): value is StaticLocale {
  return typeof value === 'string' && locales.includes(value as StaticLocale)
}

export function normalizeLocale(value: unknown): Locale {
  if (typeof value !== 'string') return defaultLocale
  const cleaned = value.trim().toLowerCase()
  return cleaned || defaultLocale
}

export function getBaseTranslations(locale: Locale): TranslationTree {
  return isLocale(locale) ? translations[locale] : translations[defaultLocale]
}
