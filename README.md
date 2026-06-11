# PlantCareApp

Interface móvel para o ecossistema **PlantCare**, desenvolvida em React Native (Expo SDK 54). O aplicativo é o principal ponto de interação do usuário com as plantas cadastradas, com o backend Supabase/Edge Functions do **PlantCareServer** e com o dispositivo ESP32 do **PlantCareFirmware**.

## Integração implementada com o PlantCareServer

A integração foi ajustada de acordo com a documentação do `PlantCareServer` e do `PlantCareFirmware` disponíveis na organização `PoliPlantCare`:

* O app lê, via Supabase SDK, as tabelas segmentadas de sensores criadas no servidor:
  * `leitura_temperatura`
  * `leitura_solo`
  * `leitura_umidade_ar`
  * `leitura_luz`
* O app assina atualizações realtime dessas tabelas e de `historico_rega`/`plantas`, quando disponíveis, para atualizar o dashboard sem recarregar manualmente.
* A ação **Regar Agora (Manual)** invoca a Edge Function `regar`, enviando `nome`, `umidade_min`, `umidade_max` e `tempo_segundos` no formato esperado pelo servidor. Depois disso, tenta registrar a ação em `historico_rega` para apoiar o requisito de pular a próxima rega automática caso a umidade esteja adequada.
* O cadastro/edição de plantas publica os limites de umidade via Edge Function `atualizar_config` e a janela preferencial de irrigação via `atualizar_horarios`, no formato MQTT esperado pelo firmware (`planta/config` e `planta/bomba/horarios`).
* O dashboard gera alertas persistentes no app quando os sensores saem da faixa esperada para a espécie cadastrada.

## Requisitos cobertos no aplicativo

* **RF01 — monitoramento a cada 10 minutos:** o app consome as medições persistidas pelo servidor nas tabelas de temperatura, umidade do solo, umidade do ar e luminosidade.
* **RF02 — modo automático/manual por planta:** o app mantém o toggle de rega automática por planta e grava a preferência em `plantas.rega_automatica` quando a tabela está disponível.
* **RF04 — cadastro de plantas limitado por banco de espécies:** o formulário permite cadastrar somente Orquídea, Jiboia, Margarida e Girassol, com nome, espécie, local aberto/fechado, exposição ao sol e horário preferencial de irrigação.
* **RF05 — irrigação automática/emergencial:** o app envia ao servidor limites de umidade por espécie; a execução autônoma permanece responsabilidade do firmware/servidor.
* **RF06 — registro de rega manual:** o app registra a rega manual local/remotamente e exibe esse evento como alerta informativo, deixando o controlador pular a próxima irrigação se a umidade estiver adequada.
* **RF07/RNF07 — alertas persistentes no app:** o app exibe alertas persistentes na tela inicial quando luminosidade, temperatura ou umidade do solo saem dos limites da espécie.
* **RF08 — histórico:** o app exibe as últimas leituras de sensores e as últimas regas registradas.

## Funcionalidades mockadas ou dependentes de backend/firmware

Alguns requisitos dependem de persistência adicional ou de comportamento no firmware/servidor. Quando a tabela/função não existe no backend atual, o app mantém um mock local ou um fallback visual:

* **Notificações push reais de RF02/RF07/RNF07:** o app exibe alertas persistentes internos, mas ainda não agenda push notifications nativas. Para concluir, é necessário adicionar `expo-notifications`, registrar tokens por usuário no backend e criar eventos/filas de alerta no PlantCareServer.
* **RF03 — verificação 15 a 30 minutos após irrigação:** o app mostra o estado e o histórico, mas a detecção confiável de falha da bomba precisa de evento no firmware/servidor comparando a umidade pós-rega e emitindo um alerta persistido.
* **RNF02 — Modo Sobrevivência por falha de sensor:** o app sinaliza leituras ausentes/inconsistentes como atenção, mas o acionamento de irrigação mínima precisa ser implementado no firmware e comunicado ao backend.
* **RNF04/RNF05/RNF06 — funcionamento offline, autonomia e bateria:** são responsabilidades do firmware/hardware. O aplicativo documenta e reflete os estados quando o servidor disponibiliza dados, mas não consegue garantir o comportamento do ESP32 sem mudanças fora deste repositório.
* **Histórico de regas remoto:** o app tenta usar `historico_rega`; se a tabela ou as permissões RLS não estiverem disponíveis, a tela fica com fallback local/visual até o backend expor essa persistência para o usuário autenticado.

## Stack Tecnológico

* **Framework:** React Native com Expo SDK 54.
* **Linguagem:** TypeScript.
* **Backend:** Supabase SDK, Supabase Realtime e Supabase Edge Functions do PlantCareServer.
* **IoT:** ESP32 publica leituras no HiveMQ; o PlantCareServer roteia os tópicos MQTT para tabelas Supabase e publica configurações de volta para o firmware.

## Como instalar e executar

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente, se necessário:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=<url-do-projeto>
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npx expo start
   ```
5. Abra no Expo Go ou em um emulador Android/iOS.

## Comandos úteis

```bash
npm test
npm run typecheck
```

## Roteiro de validação funcional

Para comprovar os requisitos funcionais e não funcionais do ecossistema PlantCare, valide:

1. Execute `npm test` para validar as regras de domínio, alertas, histórico e payloads enviados ao PlantCareServer.
2. Execute `npm run typecheck` para garantir consistência TypeScript.
3. Com o PlantCareServer apontando para o mesmo Supabase do app, publique leituras MQTT simuladas do ESP32 para confirmar que `leitura_temperatura`, `leitura_solo`, `leitura_umidade_ar` e `leitura_luz` atualizam o dashboard em tempo real.
4. Acione **Regar Agora (Manual)** e confirme no PlantCareServer/HiveMQ que a Edge Function `regar` publica o comando esperado e que o registro aparece em `historico_rega` quando a tabela/RLS estiverem configuradas.
5. Cadastre ou edite uma planta e confirme que `atualizar_config` e `atualizar_horarios` publicam, respectivamente, os limites de umidade e a janela de irrigação no formato esperado pelo firmware.
6. Simule leituras fora da faixa ideal para comprovar os alertas persistentes de solo seco, luminosidade e temperatura no app.

## Licença

Este software é **Proprietário**. Todos os direitos reservados aos autores. A cópia, modificação ou distribuição não autorizada é estritamente proibida.
