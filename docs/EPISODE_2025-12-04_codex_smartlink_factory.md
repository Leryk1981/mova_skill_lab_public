# Genetic Episode – 2025-12-04 – Codex + MOVA Skills Lab on SmartLink Factory

## 1. Context

- External repo: **MOVA SmartLink Factory** (React/Vite + Cloudflare Worker, MOVA 3.6.0).
- MOVA Skills Lab: embedded as a subfolder `mova_skills_lab/` inside SmartLink repo.
- IDE agent: **Codex** (VS Code), общение с пользователем на русском/украинском.
- Session goal: проверить, как IDE-агент может использовать Skills Lab как фабрику навыков и коннекторов, без длинных промптов.

## 2. Session goals

- Пройти полный цикл: репозиторий → снапшот → план → небольшой шаг изменений.
- Проверить инфраструктурные навыки:
  - `skill.repo_snapshot_basic`
  - `skill.repo_code_change_plan_basic`
  - `skill.code_exec_task_basic`
- Проверить фабрику навыков:
  - `skill.skill_scaffolder_basic`
  - запуск нового скилла на реальных данных.
- Проверить фабрику коннекторов:
  - `skill.connector_scaffolder_basic`
  - `skill.runtime_binding_code_scaffolder_basic` для скилла и для коннектора.
- Оценить скорость, точность и токен-затраты для реальной работы в IDE.

## 3. Skills used in this episode

- `skill.repo_snapshot_basic`  
  – дал структурированный снапшот репозитория SmartLink Factory и был сохранён как PROJECT_SNAPSHOT в самом проекте.

- `skill.repo_code_change_plan_basic`  
  – предложил план разделения контрактов и исполнения (contracts/mova3.6/*), подготовку к schema-first и будущей миграции к MOVA 4.0.0.

- `skill.code_exec_task_basic`  
  – выполнил ограниченный шаг: ввёл слой `contracts/mova3.6/*`, обновил пути в конфиге/коде, проверил `npm run build`.

- `skill.skill_scaffolder_basic`  
  – создал новый скилл `skill.smartlink_contracts_snapshot_basic` со схемами ds/env, профилем, binding и примером кейса.

- `skill.smartlink_contracts_snapshot_basic` (run)  
  – построил структурированный snapshot слоя контрактов MOVA 3.6.0 и список `open_questions` (отсутствующая infra-схема, возможные дополнительные envelopes и т.п.).

- `skill.runtime_binding_code_scaffolder_basic` (для skill)  
  – сгенерировал TypeScript-клиент `smartlinkContractsSnapshotClient.ts` с функцией `runSmartlinkContractsSnapshot(...)`.

- `skill.connector_scaffolder_basic`  
  – создал коннектор `connector.smartlink_worker_status_basic` (manifest, ds/env, HTTP binding, case).

- `skill.runtime_binding_code_scaffolder_basic` (для connector)  
  – сгенерировал TypeScript-клиент `smartlinkWorkerStatusClient.ts` с функцией `getSmartlinkWorkerStatus(...)` на основе `fetch`.

## 4. Key outcomes

- Полный вертикальный цикл Skills Lab отработал на живом проекте:
  - репо → снапшот → план → ограниченный шаг → новый скилл → новый коннектор → runtime-клиенты.
- Все операции выполнялись в отдельной ветке экспериментального репозитория, без риска для канонического `mova_skills_lab`.
- Codex корректно читал `skills_registry_v1.json`, manifest'ы и ds/env-схемы и воспринимал их как контракты, а не просто текст.
- Генерация клиентского кода (TypeScript) для скила и коннектора показала, что Skills Lab можно использовать как фабрику прикладных API-клиентов.
- Общий расход токенов на сессию ≈ 65k, что для такого объёма структуры и кода приемлемо.

## 5. Observations about agent behaviour

- Агент стабильно следовал шагам: «сначала план → потом небольшой шаг → потом код/скилл», вместо хаотичных массовых правок.
- Хорошо выдерживал языковой режим: объяснения и команды пользователю на русском/украинском, при этом идентификаторы/файлы в английской нотации.
- Уровень «понимания» Skills Lab можно считать достаточным для регулярной работы: агент уверенно опирался на registry и manifest'ы без лишних переспрашиваний.
- Точки напряжения (git-права, опасные команды) были минимизированы за счёт явного запрета на git-операции до явного разрешения.

## 6. Risks and limitations

- Все артефакты этого эпизода (новые skills/connectors/TS-клиенты) живут в стороннем репозитории SmartLink, не в каноническом `mova_skills_lab`.
- Не настроен единый формат хранения эпизодов в machine-readable виде (здесь только Markdown-отчёт).
- Не протестирована глубинная интеграция с реальным рантаймом (MCP/HTTP host) — клиенты пока работают как фасады/заглушки.
- Не проверена работа с другими агентами (Gemini/Qwen) по тому же протоколу.

## 7. Next steps suggested

- Оформить стабильный протокол IDE-агента (Profile + Protocol v1) для работы с MOVA Skills Lab в любом репозитории.
- Добавить пользовательский гайд: «Как использовать MOVA Skills Lab в своём проекте» с готовыми фразами/шаблонами для запуска ключевых skills.
- Использовать этот эпизод как эталон при интеграции внешних инструментов (например, Skill Seeker) в генетический слой MOVA.
- В будущем — перевести подобные эпизоды в формат `ds.episode_*` и хранить их в machine-readable виде для анализа и эволюции.

