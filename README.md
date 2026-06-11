# PlantCareApp

Interface móvel para o ecossistema **PlantCare**, desenvolvida em React Native (Expo). O aplicativo atua como o principal ponto de interação do usuário com suas plantas e com o sistema automatizado de irrigação.

Este projeto é a interface mobile e deve ser utilizado em conjunto com o nosso backend e hardware, que podem ser encontrados na organização GitHub: [PoliPlantCare](https://github.com/PoliPlantCare).

## Funcionalidades

De acordo com os requisitos do projeto, o aplicativo fornece:

*   **Monitoramento em Tempo Real:** Visualização contínua dos dados coletados pelos sensores do hardware (temperatura, umidade do ar, umidade do solo e luminosidade).
*   **Gestão de Plantas:** Cadastro de novas plantas a partir de um banco de dados pré-definido (como Orquídea, Jiboia, Margarida e Girassol), associando-as com seus parâmetros ideais de calibração.
*   **Controle de Irrigação:** 
    *   Configuração do modo de irrigação ("Automático" ou "Manual") de forma independente para cada planta.
    *   Definição de agendamentos e horários preferenciais para a rega.
    *   Registro manual no app de irrigações feitas pelo usuário, evitando assim regas automáticas desnecessárias.
*   **Notificações e Alertas:** Alertas push e pop-ups sobre irrigações futuras no modo manual, falhas de equipamento, ressecamento crítico do solo e dicas quanto a condições ambientais desfavoráveis.
*   **Histórico de Dados:** Armazenamento e exibição do histórico de medições passadas dos sensores e do log de irrigações efetuadas.

## Stack Tecnológico

O aplicativo foi construído priorizando a robustez, usabilidade e a integração nativa com os serviços em nuvem:

*   **Framework:** [React Native](https://reactnative.dev/) através da plataforma [Expo](https://expo.dev/) (utilizando navegação *file-based* através da pasta `app/`).
*   **Linguagem:** TypeScript, garantindo segurança de tipos e facilidade na manutenção.
*   **Integração com Backend:** [Supabase SDK](https://supabase.com/docs/reference/javascript/introduction). O app consome e envia informações diretamente para as tabelas do Supabase, aproveitando as políticas de segurança (RLS) e a comunicação *Realtime*.

## Como Instalar e Executar

Certifique-se de que o backend [PlantCareServer](https://github.com/PoliPlantCare/PlantCareServer) esteja rodando, seja localmente ou na nuvem, para o completo funcionamento do app.

1. Clone o repositório para a sua máquina local.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente baseando-se no `.env.example` preenchendo as chaves do Supabase.
4. Inicie o servidor de desenvolvimento:
   ```bash
   npx expo start
   ```
5. Utilize o app **Expo Go** em seu dispositivo móvel (lendo o QR Code) ou pressione `a`/`i` no terminal para rodar em emuladores Android ou iOS virtuais.

## Licença

Este software é **Proprietário**. Todos os direitos reservados aos autores. A cópia, modificação ou distribuição não autorizada é estritamente proibida.
